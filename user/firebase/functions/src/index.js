const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const axios = require('axios');
const { v4: uuid } = require('uuid');
const randomstring = require('randomstring');
const { 
  getSettings, 
  setUser, 
  setDevice,
  getUser,
  getTransactions,
  getEvents,
  logEvent
} = require('./firebase');
const { decryptVerify, getNewWallet } = require('./helpers');
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

        await setUser(user.uid, { apiKey, privateKey, publicKey, userId: user.uid, wallet });
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
      const user = await getUser(params.userId);
      return res.json(user ? { ...user, status: 'success' } : null);
    } catch (e) {
      console.error('user failed. Error: ', e);
      return res.status(403).json({ status: 'error', error: e.message });
    }
  });
});


exports.notify_event = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Check Fields
    const params = req.body;
    if (!params || !params.userId || !params.encrypted) {
      console.error('Log event failed. Params: ', params);
      return res.status(400).json({ error: 'Ensure all fields are included' });
    }

    try {
      // Decrypt payload and verify signature
      const result = await decryptVerify(params.encrypted, params.userId);

      if (result && result.verificationResult && result.message) {
        const deviceId = result.message.type === 'offer' 
          ? result.message.providerId 
          : result.message.requesterId;

        const transactionId = result.message.type === 'offer' 
          ? result.message.providerTransactionId 
          : result.message.requesterTransactionId;

        // Store event
        await logEvent(params.userId, deviceId, transactionId, result.message);
        return res.json({ status: 'success' });
      }

      return res.json({ status: 'error' });
    } catch (e) {
      console.error('Log event failed.', e);
      return res.status(403).json({ status: 'error', error: e.message });
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
      const user = await getUser(params.userId);

      // Check correct apiKey
      if (user && user.apiKey && user.apiKey === params.apiKey) {
        const transactions = await getTransactions(params.userId, params.deviceId);
        return res.json({ status: 'success', transactions });
      }
      return res.json({ status: 'wrong api key' });
    } catch (e) {
      console.error('Transactions request failed. Error: ', e);
      return res.status(403).json({ status: 'error', error: e.message });
    }
  });
});


exports.events = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Check Fields
    const params = req.body;
    if (!params || !params.userId || !params.deviceId || !params.transactionId || !params.apiKey) {
      console.error('Event request failed. Params: ', params);
      return res.status(400).json({ error: 'Ensure all fields are included' });
    }

    try {
      // Retrieve user
      const user = await getUser(params.userId);

      // Check correct apiKey
      if (user && user.apiKey && user.apiKey === params.apiKey) {
        const events = await getEvents(params.userId, params.deviceId, params.transactionId);
        return res.json({ status: 'success', events });
      }
      return res.json({ status: 'wrong api key' });
    } catch (e) {
      console.error('Event request failed. Error: ', e);
      return res.status(403).json({ status: 'error', error: e.message });
    }
  });
});


exports.device = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Check Fields
    const params = req.body;
    if (!params 
      || !params.userId 
      || !params.apiKey
      || !params.deviceName 
      || !params.type 
      || !params.location 
      || !params.deviceURL
      || !params.minWalletAmount 
      || !params.minOfferAmount 
      || !params.maxEnergyPrice 
      || !params.running 
      || !params.dashboard
      || !params.uuid
      ) {
      console.error('Device creation request failed. Params: ', params);
      return res.status(400).json({ error: 'Ensure all fields are included' });
    }

    try {
      const user = await getUser(params.userId, true);
      
      // Check correct apiKey
      if (user && user.apiKey && user.apiKey === params.apiKey) {
        const settings = await getSettings();

        let wallet;
        let deviceId;
        let image = '';
        const existingDevice = user.devices.find(dev => 
          (params.deviceId && (dev.id === params.deviceId)) || (dev.uuid === params.uuid));

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
          minWalletAmount: Number(params.minWalletAmount),
          minOfferAmount: Number(params.minOfferAmount),
          assetOwnerAPI: settings.assetOwnerAPI,
          marketplaceAPI: settings.marketplaceAPI,
          assetId: deviceId,
          assetName: params.deviceName,
          assetDescription: params.deviceDescription || '',
          type: params.type,
          assetOwner: user.userId,
          network: settings.tangle.network,
          location: params.location,
          assetWallet: wallet,
          marketplacePublicKey: settings.marketplacePublicKey,
          assetOwnerPublicKey: user.publicKey,
          status: params.running === 'true' ? 'running' : 'paused',
          dashboard: params.dashboard === 'true' ? 'enabled' : 'disabled',
          uuid: params.uuid
        }

        // Send payload to device
        const headers = { 'Content-Type': 'application/json' };
        const deviceResponse = await axios.post(`${params.deviceURL}/init`, payload, { headers });
        
        console.log('API', deviceResponse.data);

        // Receive public key
        if (deviceResponse 
          && deviceResponse.data 
          && deviceResponse.data.success 
          && deviceResponse.data.publicKey 
        ) {
          const device = {
            status: params.running === 'true',
            id: deviceId,
            name: params.deviceName,
            description: params.deviceDescription || '',
            publicKey: deviceResponse.data.publicKey,
            image: image || '',
            type: params.type,
            location: params.location,
            dashboard: params.dashboard === 'true',
            uuid: params.uuid,
            maxEnergyPrice: Number(params.maxEnergyPrice),
            minWalletAmount: Number(params.minWalletAmount),
            minOfferAmount: Number(params.minOfferAmount),
            wallet
          }

          // Store device info
          await setDevice(params.userId, device);
          return res.json({ status: 'success' });
        } else if (!deviceResponse.data.success && deviceResponse.data.error) {
          return res.status(403).json({ status: deviceResponse.data.error });
        }
        return res.status(403).json({ status: 'Something went wrong' });
      }
      return res.status(403).json({ status: 'Wrong api key' });
    } catch (e) {
      console.error('Device creation request failed. Device not reachable', e);
      return res.status(403).json({ status: 'error', error: 'Device creation request failed. Device not reachable' });
    }
  });
});

exports.image = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Check Fields
    const params = req.body;
    if (!params 
      || !params.userId 
      || !params.apiKey
      || !params.deviceId 
      || !params.image
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
        return res.json({ status: 'no device found' });
      }
      return res.json({ status: 'wrong api key' });
    } catch (e) {
      console.error('Image upload request failed. Error: ', e);
      return res.status(403).json({ status: 'error', error: e.message });
    }
  });
});