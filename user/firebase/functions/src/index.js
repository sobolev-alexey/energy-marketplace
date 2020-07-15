const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const axios = require('axios');
const https = require('https');
const { v4: uuid } = require('uuid');
const randomstring = require('randomstring');
const {
  getSettings,
  setUser,
  setDevice,
  getUser,
  getTransactions,
  getEvents,
  getDevice,
  logEvent,
  updateWalletKeyIndex,
} = require('./firebase');
const {
  decryptVerify,
  getNewWallet,
  faucet,
  getBalance,
  checkBalance,
  withdraw,
} = require('./helpers');
const { EncryptionService } = require('./encryption');

// Setup User with an API Key
exports.setupUser = functions.auth.user().onCreate(user => {
  return new Promise(async (resolve, reject) => {
    if (!user) {
      reject();
    } else {
      try {
        const apiKey = uuid();
        const encryptionService = EncryptionService();
        const { privateKey, publicKey } = encryptionService.generateKeys();
        const wallet = await getNewWallet();

        await setUser(user.uid, {
          apiKey,
          privateKey,
          publicKey,
          userId: user.uid,
          wallet,
        });
        resolve();
      } catch (e) {
        console.error('setupUser rejected with ', e);
        reject(e.message);
      }
    }
  });
});

exports.user = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Check Fields
    const params = req.body;
    if (!params || !params.userId) {
      console.error('Get user failed. Params: ', params);
      return res.status(400).json({ error: 'Ensure all fields are included' });
    }

    try {
      // Retrieve user
      const user = await getUser(params.userId, true);
      return res.json(user ? { ...user, status: 'success' } : null);
    } catch (e) {
      console.error('user failed. Error: ', e);
      return res.json({ status: 'error', error: e.message });
    }
  });
});

exports.notify_event = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Check Fields
    const params = req.body;
    if (!params || !params.userId || !params.keyIndex || !params.encrypted) {
      console.error('Log event failed. Params: ', params);
      return res.status(400).json({ error: 'Ensure all fields are included' });
    }

    try {
      // Decrypt payload and verify signature
      const result = await decryptVerify(params.encrypted, params.userId);

      if (result && result.verificationResult && result.message) {
        const deviceId =
          result.message.type === 'offer'
            ? result.message.providerId
            : result.message.requesterId;

        const transactionId =
          result.message.type === 'offer'
            ? result.message.providerTransactionId
            : result.message.requesterTransactionId;

        // Store event
        await logEvent(
          params.userId,
          deviceId,
          transactionId,
          result.message,
          result.mam
        );
        await updateWalletKeyIndex(params.userId, deviceId, params.keyIndex);
        return res.json({ status: 'success' });
      }

      return res.json({ status: 'error' });
    } catch (e) {
      console.error('Log event failed.', e);
      return res.json({ status: 'error', error: e.message });
    }
  });
});

exports.events = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Check Fields
    const params = req.body;
    if (
      !params ||
      !params.userId ||
      !params.deviceId ||
      !params.transactionId ||
      !params.apiKey
    ) {
      console.error('Event request failed. Params: ', params);
      return res.status(400).json({ error: 'Ensure all fields are included' });
    }

    try {
      // Retrieve user
      const user = await getUser(params.userId, true);

      // Check correct apiKey
      if (user && user.apiKey && user.apiKey === params.apiKey) {
        const events = await getEvents(
          params.userId,
          params.deviceId,
          params.transactionId
        );
        return res.json({ status: 'success', events });
      }
      return res.json({ status: 'error', error: 'wrong api key' });
    } catch (e) {
      console.error('Event request failed. Error: ', e);
      return res.json({ status: 'error', error: e.message });
    }
  });
});

exports.device = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Check Fields
    const params = req.body;
    if (
      !params ||
      !params.userId ||
      !params.apiKey ||
      !params.name ||
      !params.type ||
      !params.location ||
      !params.url ||
      !params.minOfferAmount ||
      !params.maxEnergyPrice ||
      !params.running ||
      !params.dashboard ||
      !params.uuid
    ) {
      console.error('Device creation request failed. Params: ', params);
      return res.status(400).json({ error: 'Ensure all fields are included' });
    }

    try {
      const user = await getUser(params.userId, true, true);

      // Check correct apiKey
      if (user && user.apiKey && user.apiKey === params.apiKey) {
        const settings = await getSettings();

        let wallet;
        let deviceId;
        let image = '';
        const existingDevice = user.devices.find(
          dev =>
            (params.deviceId && dev.id === params.deviceId) ||
            dev.uuid === params.uuid
        );

        if (existingDevice) {
          wallet = existingDevice && existingDevice.wallet;
          deviceId = existingDevice && existingDevice.id;
          image = existingDevice && existingDevice.image;
        } else {
          // Create device wallet
          wallet = await getNewWallet();
          deviceId = randomstring.generate(16);
        }

        // Compose payload
        const payload = {
          exchangeRate: Number(settings.exchangeRate),
          maxEnergyPrice: Number(params.maxEnergyPrice),
          minOfferAmount: Number(params.minOfferAmount),
          assetOwnerAPI: settings.assetOwnerAPI,
          marketplaceAPI: settings.marketplaceAPI,
          assetId: deviceId,
          assetName: params.name,
          assetDescription: params.description || '',
          type: params.type,
          assetOwner: user.userId,
          network: settings.tangle.network,
          location: params.location,
          assetWallet: wallet,
          marketplacePublicKey: settings.marketplacePublicKey,
          assetOwnerPublicKey: user.publicKey,
          status: params.running === true ? 'running' : 'paused',
          dashboard: params.dashboard === true ? 'enabled' : 'disabled',
          uuid: params.uuid,
          url: params.url,
        };

        console.log('Payload', JSON.stringify(payload));

        // Send payload to device
        const headers = { 'Content-Type': 'application/json' };
        const httpsAgent = new https.Agent({ rejectUnauthorized: false });
        let deviceResponse;
        try {
          const response = await axios.post(`${params.url}/init`, payload, {
            headers,
            httpsAgent,
          });
          deviceResponse = response;
          console.log('API', response && JSON.stringify(response.data));
        } catch (error) {
          console.error('AXIOS', error);

          if (error.response) {
            // Request made and server responded
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
          } else if (error.request) {
            // The request was made but no response was received
            console.log(error.request);
          } else {
            // Something happened in setting up the request that triggered an Error
            console.log('AXIOS Error', error.message);
          }
        }

        // Receive public key
        if (
          deviceResponse &&
          deviceResponse.data &&
          deviceResponse.data.success &&
          deviceResponse.data.publicKey
        ) {
          const device = {
            running: params.running,
            id: deviceId,
            name: params.name,
            url: params.url,
            description: params.description || '',
            publicKey: deviceResponse.data.publicKey,
            image: image || '',
            type: params.type,
            location: params.location,
            dashboard: params.dashboard,
            uuid: params.uuid,
            maxEnergyPrice: Number(params.maxEnergyPrice),
            minOfferAmount: Number(params.minOfferAmount),
            wallet,
          };

          // Store device info
          await setDevice(params.userId, device);
          return res.json({ status: 'success', deviceId });
        } else if (!deviceResponse.data.success && deviceResponse.data.error) {
          return res.json({ status: 'error', error: deviceResponse.data.error });
        }
        return res.json({ status: 'error', error: 'Something went wrong' });
      }
      return res.json({ status: 'error', error: 'Wrong api key' });
    } catch (e) {
      console.error('Device creation request failed. Device not reachable', e);
      return res.json({
        status: 'error',
        error: 'Device creation request failed. Device not reachable',
      });
    }
  });
});

exports.image = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Check Fields
    const params = req.body;
    if (
      !params ||
      !params.userId ||
      !params.apiKey ||
      !params.deviceId ||
      !params.image
    ) {
      console.error('Image upload request failed. Params: ', params);
      return res.status(400).json({ error: 'Ensure all fields are included' });
    }

    try {
      const user = await getUser(params.userId, true);

      // Check correct apiKey
      if (user && user.apiKey && user.apiKey === params.apiKey) {
        const device = user.devices.find(dev => dev.id === params.deviceId);
        // Receive public key
        if (device) {
          // Update device info
          await setDevice(params.userId, { ...device, image: params.image });
          return res.json({ status: 'success' });
        }
        return res.json({ status: 'error', error: 'no device found' });
      }
      return res.json({ status: 'error', error: 'wrong api key' });
    } catch (e) {
      console.error('Image upload request failed. Error: ', e);
      return res.json({ status: 'error', error: e.message });
    }
  });
});

exports.faucet = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Check Fields
    const packet = req.body;
    if (!packet || !packet.address) {
      console.error('faucet failed. Receiving Address: ', packet.address);
      return res.status(400).json({ error: 'Malformed Request' });
    }

    try {
      const transactions = await faucet(packet.address, packet.userId);
      return res.json({ transactions });
    } catch (e) {
      console.error('faucet failed. Error: ', e.message);
      return res.json({ status: 'error', error: e.message });
    }
  });
});

exports.withdraw = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Check Fields
    const packet = req.body;
    if (!packet || !packet.userId) {
      console.error(
        'withdraw failed. User ID: ' +
          packet.userId +
          '\n' +
          'Device ID: ' +
          packet.deviceId
      );
      return res.status(400).json({ error: 'Malformed Request' });
    }

    try {
      const transactions = await withdraw(packet.userId, packet.deviceId);
      return res.json({ transactions });
    } catch (e) {
      console.error('withdraw failed. Error: ', e.message);
      return res.json({ status: 'error', error: e.message });
    }
  });
});

exports.balance = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Check Fields
    const packet = req.body;
    if (!packet || !packet.address) {
      console.error('balance failed. Receiving Address: ', packet.address);
      return res.status(400).json({ error: 'Malformed Request' });
    }

    try {
      const balance = await getBalance(packet.address);
      return res.json({ balance });
    } catch (e) {
      console.error('balance failed. Error: ', e.message);
      return res.json({ status: 'error', error: e.message });
    }
  });
});

exports.info = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Check Fields
    const params = req.body;
    if (!params || !params.userId || !params.apiKey || !params.deviceId) {
      console.error('Device info request failed. Params: ', params);
      return res.status(400).json({ error: 'Ensure all fields are included' });
    }

    try {
      const user = await getUser(params.userId, true);

      // Check correct apiKey
      if (user && user.apiKey && user.apiKey === params.apiKey) {
        const { device, error } = await getDevice(params.userId, params.deviceId);
        if (error) {
          throw new Error(error);
        } else {
          return res.json({ status: 'success', device });
        }
      }
      return res.json({ status: 'error', error: 'Wrong api key' });
    } catch (e) {
      console.error('Device info request failed', e);
      return res.json({ status: 'error', error: e.message });
    }
  });
});

exports.transactions = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Check Fields
    const params = req.body;
    if (!params || !params.userId || !params.deviceId || !params.apiKey) {
      console.error('Transactions request failed. Params: ', params);
      return res.status(400).json({ error: 'Ensure all fields are included' });
    }

    try {
      // Retrieve user
      const user = await getUser(params.userId, true);

      // Check correct apiKey
      if (user && user.apiKey && user.apiKey === params.apiKey) {
        const transactions = await getTransactions(
          params.userId,
          params.deviceId
        );
        return res.json({ status: 'success', transactions });
      }
      return res.json({ status: 'error', error: 'wrong api key' });
    } catch (e) {
      console.error('Transactions request failed. Error: ', e);
      return res.json({ status: 'error', error: e.message });
    }
  });
});

exports.fund = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Check Fields
    const params = req.body;
    if (!params || !params.userId || !params.keyIndex || !params.encrypted) {
      console.error('Log event failed. Params: ', params);
      return res.status(400).json({ error: 'Ensure all fields are included' });
    }

    try {
      // Decrypt payload and verify signature
      const result = await decryptVerify(params.encrypted, params.userId);

      if (result && result.verificationResult && result.message) {
        const deviceId =
          result.message.type === 'offer'
            ? result.message.providerId
            : result.message.requesterId;
        const user = await getUser(params.userId, true, true);
        const settings = await getSettings();

        const existingDevice = user.devices.find(
          device => device.id === deviceId
        );

        if (existingDevice) {
          const { address, balance } = await checkBalance(existingDevice.wallet);

          if (balance < settings.deviceWalletAmount) {
            console.log(
              `Fund device ${deviceId}, current balance: ${balance}. Wallet address: ${address}`
            );
            await faucet(address);
            return res.json({ status: 'success' });
          } else {
            return res.json({ status: 'error', error: 'enough balance' });
          }
        } else {
          return res.json({ status: 'error', error: 'no device' });
        }
      }

      return res.json({ status: 'error' });
    } catch (e) {
      console.error('Log event failed.', e);
      return res.json({ status: 'error', error: e.message });
    }
  });
});
