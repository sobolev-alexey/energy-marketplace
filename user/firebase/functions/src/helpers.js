const crypto = require("crypto");
const { generateAddress, createPrepareTransfers } = require("@iota/core");
const {
  composeAPI,
  FailMode,
  LinearWalkStrategy,
  RandomWalkStrategy,
  SuccessMode,
} = require("@iota/client-load-balancer");
const { getSettings, getUser, getIotaWallet, updateWalletAddressKeyIndex } = require("./firebase");
const { EncryptionService } = require("./encryption");

const decryptVerify = async (encrypted, userId) => {
  try {
    if (encrypted && userId) {
      const user = await getUser(userId, true);
      if (user && user.privateKey) {
        const encryptionService = EncryptionService();

        const decrypted = encryptionService.privateDecrypt(user.privateKey, encrypted);

        const assetId =
          decrypted.message && decrypted.message.type === "offer"
            ? decrypted.message && decrypted.message.providerId
            : decrypted.message && decrypted.message.requesterId;

        const device = user.devices.find((asset) => asset.id === assetId);

        const verificationResult = encryptionService.verifySignature(
          device.publicKey,
          decrypted.message,
          decrypted.signature
        );

        return { verificationResult, message: decrypted.message };
      }
      throw new Error("No user key");
    } else {
      throw new Error("No encrypted payload found");
    }
  } catch (error) {
    throw new Error(error);
  }
};

const generateSeed = (length = 81) => {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ9";
  let seed = "";
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

const getBalance = async (address) => {
  try {
    if (!address) {
      return 0;
    }
    const settings = await getSettings();
    console.log("getBalance TEST");
    const api = await getApi(settings);
    const { balances } = await api.getBalances([address]);
    return balances && balances.length > 0 ? balances[0] : 0;
  } catch (error) {
    console.error("getBalance error", error);
    return 0;
  }
};

const getApi = async (settings) => {
  const api = await composeAPI({
    nodeWalkStrategy: new LinearWalkStrategy(settings.nodes.map((provider) => ({ provider }))),
    depth: settings.tangle.depth,
    mwm: settings.tangle.mwm,
    successMode: SuccessMode[settings.tangle.loadBalancerSuccessMode],
    failMode: FailMode.all,
    timeoutMs: settings.tangle.loadBalancerTimeout,
    // tryNodeCallback: (node) => {
    //   console.log(`Trying node ${node.provider}`);
    // },
    failNodeCallback: (node, err) => {
      console.error(`Failed node ${node.provider}, ${err.message}`);
    },
  });

  return api;
  // try {
  //   const api = composeAPI({
  //     nodeWalkStrategy: new LinearWalkStrategy([
  //       {
  //         provider: "https://altnodes.devnet.iota.org:443",
  //         depth: 3,
  //         mwm: 9,
  //       },
  //     ]),
  //     successMode: SuccessMode.next,
  //     failMode: FailMode.all,
  //     timeoutMs: 5000,
  //     tryNodeCallback: (node) => {
  //       console.log(`Trying node ${node.provider}`);
  //     },
  //     failNodeCallback: (node, err) => {
  //       console.log(`Failed node ${node.provider}, ${err.message}`);
  //     },
  //   });

  //   const res = await api.getNodeInfo();
  //   console.log("App Name:", res.appName);
  //   console.log("App Version:", res.appVersion);
  //   return api;
  // } catch (error) {
  //   console.error(`Error: ${error.message}`);
  //   return error;
  // }
};

const transferFunds = async (receiveAddress, address, keyIndex, seed, value, updateFn, userId = null) => {
  try {
    const settings = await getSettings();
    const api = await getApi(settings);
    const { getInclusionStates, sendTrytes } = api;
    const prepareTransfers = createPrepareTransfers();
    const security = 2;
    const balance = await getBalance(address);

    // Depth or how far to go for tip selection entry point
    const depth = settings.tangle.depth;

    // Difficulty of Proof-of-Work required to attach transaction to tangle.
    // Minimum value on mainnet & spamnet is `14`, `9` on devnet and other testnets.
    const minWeightMagnitude = settings.tangle.mwm;

    if (balance === 0) {
      console.error("transferFunds. Insufficient balance", address, balance, userId);
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
        .then(async (trytes) => {
          sendTrytes(trytes, depth, minWeightMagnitude)
            .then(async (transactions) => {
              await updateFn(remainderAddress, keyIndex + 1, userId);

              const hashes = transactions.map((transaction) => transaction.hash);

              let retries = 0;
              while (retries++ < 20) {
                const statuses = await getInclusionStates(hashes);
                if (statuses.filter((status) => status).length === 4) break;
                await new Promise((resolved) => setTimeout(resolved, 10000));
              }

              resolve(transactions);
            })
            .catch((error) => {
              console.error("transferFunds sendTrytes error", error);
              reject(error);
            });
        })
        .catch((error) => {
          console.error("transferFunds prepareTransfers error", error);
          reject(error);
        });
    });
    return promise;
  } catch (error) {
    console.error("transferFunds catch", error);
    return error;
  }
};

const repairWallet = async (seed, keyIndex) => {
  try {
    // Iterating through keyIndex ordered by likelyhood
    for (const value of [-2, -1, 1, 2, 3, 4, -3, -4, -5, -6, -7, 5, 6, 7]) {
      const newIndex = Number(keyIndex) + Number(value);
      if (newIndex >= 0) {
        const newAddress = await generateAddress(seed, newIndex);
        const newBalance = await getBalance(newAddress);
        if (newBalance > 0) {
          console.log(
            `Repair wallet executed. Old keyIndex: ${keyIndex}, new keyIndex: ${newIndex}. New wallet balance: ${newBalance}. New address: ${newAddress}`
          );
          return { address: newAddress, keyIndex: newIndex };
        }
      }
    }
  } catch (error) {
    console.log("Repair wallet Error", error);
    return error;
  }
};

const faucet = async (receiveAddress) => {
  let { keyIndex, seed, balance } = await getIotaWallet();
  console.log("BALANCE1", balance);
  let address = await generateAddress(seed, keyIndex);
  const iotaWalletBalance = await getBalance(address);
  console.log("BALANCE2", iotaWalletBalance);

  if (iotaWalletBalance === 0) {
    const newIotaWallet = await repairWallet(seed, keyIndex);
    if (newIotaWallet && newIotaWallet.address && newIotaWallet.keyIndex) {
      address = newIotaWallet.address;
      keyIndex = newIotaWallet.keyIndex;
    }
  }
  console.log("BALANCE3", iotaWalletBalance);
  return await transferFunds(receiveAddress, address, keyIndex, seed, balance, updateWalletAddressKeyIndex);
};

module.exports = {
  decryptVerify,
  getNewWallet,
  faucet,
  getBalance,
  repairWallet,
};
