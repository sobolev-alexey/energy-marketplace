const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

exports.setUser = async (uid, obj) => {
  await admin
    .firestore()
    .collection('users')
    .doc(uid)
    .set(obj);

  return true;
};

exports.setDevice = async (userId, device) => {
  await admin
    .firestore()
    .collection(`users/${userId}/devices`)
    .doc(device.id)
    .set(device, { merge: true });

  return true;
};

exports.getUser = async (userId, internal = false) => {
  // Get user
  const userDocument = await admin
    .firestore()
    .collection('users')
    .doc(userId)
    .get();

  // Check and return user
  if (userDocument.exists) {
    const user = userDocument.data();

    if (!internal) {
      delete user.privateKey;
      delete user.publicKey;
      delete user.userId;
    }

    if (user.wallet) {
      delete user.wallet.seed;
      delete user.wallet.keyIndex;
    }

    // Get user devices
    const devicesSnapshot = await admin
    .firestore()
    .collection('users')
    .doc(userId)
    .collection('devices')
    .get();

    user.devices = devicesSnapshot.docs.map(document => {
      if (document.exists) {
        const device = document.data();

        if (!internal) {
          delete device.publicKey;
        }

        if (device.wallet) {
          delete device.wallet.seed;
          delete device.wallet.keyIndex;
        }
        return device;
      } else {
        return null;
      }
    });

    return user;
  }

  console.log('User not in DB:', userId);
  return null;
};

exports.getTransactions = async (userId, deviceId) => {
  // Get transactions
  const querySnapshot = await admin
    .firestore()
    .collection(`events/${userId}/devices/${deviceId}/transactions`)
    .get();

  // Check there is data
  if (querySnapshot.size === 0) return [];

  // Return data
  return querySnapshot.docs.filter(doc => doc.exists && doc.data());
};

exports.getEvents = async (userId, deviceId, transactionId) => {
  // Get events
  const querySnapshot = await admin
    .firestore()
    .collection(`events/${userId}/devices/${deviceId}/transactions/${transactionId}/events`)
    .get();

  // Check there is data
  if (querySnapshot.size === 0) return [];

  // Return data
  return querySnapshot.docs.filter(doc => doc.exists && doc.data());
};

exports.getSettings = async () => {
  // Get settings
  const doc = await admin
    .firestore()
    .collection('settings')
    .doc('settings')
    .get();
  if (doc.exists) {
    return doc.data();
  }
  
  const message = 'getSettings failed. Setting does not exist';
  console.error(message, doc);
  throw Error(message);
};

exports.logMessage = async (userId, deviceId, messages) => {
  const timestamp = (new Date()).toLocaleString().replace(/\//g, '.');

  // Save logs by user and device
  await admin
    .firestore()
    .collection(`logs/${userId}/devices/${deviceId}/log`)
    .doc(timestamp)
    .set({ 
      ...messages.map(message => message),
      timestamp
    }, { merge: true });

  return true;
};

exports.logEvent = async (userId, deviceId, transactionId, event) => {
  const timestamp = (new Date()).toLocaleString().replace(/\//g, '.');

  // Save logs by user and device
  await admin
    .firestore()
    .collection(`events/${userId}/devices/${deviceId}/transactions/${transactionId}/events`)
    .doc(timestamp)
    .set({ 
      ...event,
      timestamp
    }, { merge: true });

  return true;
};
