const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const { v4: uuid } = require('uuid');
const isEmpty = require('lodash/isEmpty');
const { 
  getSettings, 
  getChannelState, 
  logMessage, 
  setUser, 
  getUser,
  getTransactions,
  getEvents,
  logEvent
} = require('./firebase');
const { fetch } = require('./mam');
const { decryptVerify } = require('./helpers');
const { EncryptionService } = require('./encryption');


// Setup User with an API Key
exports.setupUser = functions.auth.user().onCreate(user => {
  return new Promise(async (resolve, reject) => {
    console.log('setupUser', user);
    if (!user) {
      reject();
    } else {
      // Try saving
      try {
        const apiKey = uuid();
        const encryptionService = EncryptionService();
        const { privateKey, publicKey } = encryptionService.generateKeys();
        console.log('Keys', privateKey, publicKey);

        await setUser(user.uid, { apiKey, privateKey, publicKey });
        console.log('setupUser resolved for UID', user.uid);
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
    if (!params || !params.userId || !params.deviceId || !params.transactionId || !params.event) {
      console.error('Log event failed. Params: ', params);
      return res.status(400).json({ error: 'Ensure all fields are included' });
    }

    try {
      // Store event
      await logEvent(params.userId, params.deviceId, params.transactionId, params.event);
      return res.json({ status: 'success' });
    } catch (e) {
      console.error('Log event failed. Error: ', e);
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