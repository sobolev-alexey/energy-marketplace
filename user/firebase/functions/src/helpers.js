const crypto = require('crypto');
const { generateAddress, createPrepareTransfers } = require('@iota/core');
const {
  composeAPI,
  FailMode,
  RandomWalkStrategy,
  SuccessMode,
} = require('@iota/client-load-balancer');
const {
  getSettings,
  getUser,
  updateWalletAddressKeyIndex,
} = require('./firebase');
const { EncryptionService } = require('./encryption');

const decryptVerify = async (encrypted, userId) => {
  try {
    if (encrypted && userId) {
      const user = await getUser(userId, true);
      if (user && user.privateKey) {

        const encryptionService = EncryptionService();

        const decrypted = encryptionService.privateDecrypt(
          user.privateKey, encrypted
        );

        let assetId;
        if (decrypted.message.assetId) {
          assetId = decrypted.message.assetId;
        } else {
          assetId = decrypted.message.type && decrypted.message.type === 'offer'
            ? decrypted.message.providerId
            : decrypted.message.requesterId;
        }

        const device = user.devices.find(asset => asset.id === assetId);

        const verificationResult = encryptionService.verifySignature(
          device.publicKey, decrypted.message, decrypted.signature
        );  
              
        return { verificationResult, message: decrypted.message, mam: decrypted.mam, assetId };
      }
      throw new Error('No user key');
    } else {
      throw new Error('No encrypted payload found');
    }
  } catch (error) {
    throw new Error(error);
  }
};

const generateSeed = (length = 81) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
  let seed = '';
  while (seed.length < length) {
    const byte = crypto.randomBytes(1);
    if (byte[0] < 243) {
      seed += charset.charAt(byte[0] % 27);
    }
  }
  return seed;
};

const getNewWallet = async () => {
  const settings = await getSettings();
  const security = (settings && settings.tangle && settings.tangle.security) || 2;
  const seed = generateSeed();
  const keyIndex = 0;
  const address = generateAddress(seed, keyIndex, security, true);

  return { seed, address, keyIndex, balance: 0 };
};

const getBalance = async address => {
  try {
    if (!address) {
      return 0;
    }
    const settings = await getSettings();
    const api = await getApi(settings);
    const { balances } = await api.getBalances([address]);
    return balances && balances.length > 0 ? balances[0] : 0;
  } catch (error) {
    console.error('getBalance error', error);
    return 0;
  }
};

const getApi = async settings => {
  const api = await composeAPI({
    nodeWalkStrategy: new RandomWalkStrategy(
      settings.nodes.map(provider => ({ provider }))
    ),
    depth: settings.tangle.depth,
    mwm: settings.tangle.mwm,
    successMode: SuccessMode[settings.tangle.loadBalancerSuccessMode],
    failMode: FailMode.all,
    timeoutMs: settings.tangle.loadBalancerTimeout,
    failNodeCallback: (node, err) => {
      console.error(`Failed node ${node.provider}, ${err.message}`);
    },
  });

  return api;
};

const transferFunds = async (
  receiveAddress,
  address,
  keyIndex,
  seed,
  value,
  updateFn,
  userId = null,
  deviceId = null
) => {
  try {
    const settings = await getSettings();
    const api = await getApi(settings);
    const { getInclusionStates, sendTrytes } = api;
    const prepareTransfers = createPrepareTransfers();
    const balance = await getBalance(address);

    const depth = settings.tangle.depth;
    const minWeightMagnitude = settings.tangle.mwm;
    const security = settings.tangle.security;

    if (balance === 0) {
      console.error('transferFunds. Insufficient balance', address, balance, userId);
      return null;
    }

    const promise = new Promise((resolve, reject) => {
      const transfers = [{ address: receiveAddress, value }];
      const remainderAddress = generateAddress(seed, keyIndex + 1);
      const options = {
        inputs: [
          {
            address,
            keyIndex,
            security,
            balance,
          },
        ],
        security,
        remainderAddress,
      };

      prepareTransfers(seed, transfers, options)
        .then(async trytes => {
          sendTrytes(trytes, depth, minWeightMagnitude)
            .then(async transactions => {
              await updateFn(remainderAddress, keyIndex + 1, userId, deviceId);

              const hashes = transactions.map(transaction => transaction.hash);

              let retries = 0;
              while (retries++ < 20) {
                const statuses = await getInclusionStates(hashes);
                if (statuses.filter(status => status).length === 4) break;
                await new Promise(resolved => setTimeout(resolved, 10000));
              }

              resolve(transactions);
            })
            .catch(error => {
              console.error('transferFunds sendTrytes error', error);
              reject(error);
            });
        })
        .catch(error => {
          console.error('transferFunds prepareTransfers error', error);
          reject(error);
        });
    });
    return promise;
  } catch (error) {
    console.error('transferFunds catch', error);
    return error;
  }
};

const repairWallet = async (seed, keyIndex) => {
  try {
    // Iterating through keyIndex ordered by likelyhood
    // for (const value of [-2, -1, 1, 2, 3, 4, -3, -4, -5, -6, -7, 5, 6, 7]) {
    for (const value of [...Array.from(Array(50).keys()), ...Array.from(Array(10).keys()).map(val => -val)]) {
      const newIndex = Number(keyIndex) + Number(value);
      if (newIndex >= 0) {
        const newAddress = await generateAddress(seed, newIndex);
        const newBalance = await getBalance(newAddress);
        if (newBalance > 0) {
          console.log(
            `Repair wallet executed. Old keyIndex: ${keyIndex}, new keyIndex: ${newIndex}. New wallet balance: ${newBalance}. New address: ${newAddress}`
          );
          return { address: newAddress, balance: newBalance, keyIndex: newIndex };
        }
      }
    }
    return null;
  } catch (error) {
    console.log('Repair wallet Error', error);
    return error;
  }
};

const withdraw = async (userId, wallet, withdrawAddress, deviceId = null) => {
  const settings = await getSettings();

  let { keyIndex, seed } = wallet;
  let address = await generateAddress(seed, keyIndex);
  let walletBalance = await getBalance(address);

  if (walletBalance === 0) {
    const newWallet = await repairWallet(seed, keyIndex);
    if (newWallet && newWallet.address && newWallet.keyIndex) {
      address = newWallet.address;
      keyIndex = newWallet.keyIndex;
      walletBalance = newWallet.balance;
    } else {
      throw new Error('Withdraw failed: sender wallet has no funds');
    }
  }

  return await transferFunds(
    withdrawAddress || settings.wallet.address,
    address,
    keyIndex,
    seed,
    walletBalance,
    updateWalletAddressKeyIndex,
    userId,
    deviceId
  );
};

const faucet = async (mode, receiverWallet, sender) => {
  const settings = await getSettings();
  let wallet;
  let amount;

  if (mode === 'device') {
    wallet = sender && sender.wallet;
    amount = settings.deviceWalletAmount;
  } else if (mode === 'user') {
    wallet = settings && settings.wallet;
    amount = settings.userWalletAmount;
  }

  let { keyIndex, seed } = wallet;
  let address = await generateAddress(seed, keyIndex);
  const walletBalance = await getBalance(address);

  if (walletBalance === 0) {
    const newWallet = await repairWallet(seed, keyIndex);
    if (newWallet && newWallet.address && newWallet.keyIndex && newWallet.balance >= amount) {
      address = newWallet.address;
      keyIndex = newWallet.keyIndex;
    } else {
      throw new Error('Faucet failed: sender wallet has no funds');
    }
  }

  let receiverWalletAddress = await generateAddress(receiverWallet.seed, receiverWallet.keyIndex);
  const receiverWalletBalance = await getBalance(receiverWalletAddress);

  if (receiverWalletBalance === 0) {
    const newReceiverWallet = await repairWallet(receiverWallet.seed, receiverWallet.keyIndex);
    if (newReceiverWallet && newReceiverWallet.address) {
      receiverWalletAddress = newReceiverWallet.address;
    }
  }

  return await transferFunds(
    receiverWalletAddress,
    address,
    keyIndex,
    seed,
    amount,
    updateWalletAddressKeyIndex,
    sender && sender.userId
  );
};

const checkBalance = async ({ seed, keyIndex }) => {
  let address = await generateAddress(seed, keyIndex);
  const balance = await getBalance(address);

  return { address, balance };
};

module.exports = {
  decryptVerify,
  getNewWallet,
  faucet,
  getBalance,
  repairWallet,
  checkBalance,
  transferFunds,
  withdraw,
};