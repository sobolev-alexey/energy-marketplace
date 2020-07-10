const functions = require("firebase-functions");
const admin = require("firebase-admin");

// admin.initializeApp(functions.config().firebase);
admin.initializeApp({
  credential: admin.credential.cert(require("../../admin.json")),
});

exports.setUser = async (uid, obj) => {
  await admin.firestore().collection("users").doc(uid).set(obj);

  return true;
};

exports.setDevice = async (userId, device) => {
  await admin.firestore().collection(`users/${userId}/devices`).doc(device.id).set(device, { merge: true });

  return true;
};

exports.getUser = async (userId, internal = false) => {
  // Get user
  const userDocument = await admin.firestore().collection("users").doc(userId).get();

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
    const devicesSnapshot = await admin.firestore().collection("users").doc(userId).collection("devices").get();

    user.devices = devicesSnapshot.docs.map((document) => {
      if (document.exists) {
        const device = document.data();

        if (!internal) {
          delete device.publicKey;
        }

        if (device.wallet) {
          delete device.wallet.seed;
          delete device.wallet.keyIndex;
        }

        delete device.key;
        return device;
      } else {
        return null;
      }
    });

    return user;
  }

  console.log("User not in DB:", userId);
  return null;
};

exports.getTransactions = async (userId, deviceId) => {
  // Get transactions
  const querySnapshot = await admin.firestore().collection(`events/${userId}/devices/${deviceId}/transactions`).get();

  // Check there is data
  if (querySnapshot.size === 0) return [];

  // Return data
  return querySnapshot.docs.filter((doc) => doc.exists && doc.data());
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
  return querySnapshot.docs.filter((doc) => doc.exists && doc.data());
};

exports.getIotaWallet = async () => {
  const doc = await admin.firestore().collection("settings").doc("settings").get();
  if (doc.exists) {
    const data = doc.data();
    if (data.wallet) {
      return data.wallet;
    }
    console.error("getIotaWallet failed. Setting does not exist", data.wallet);
  }
  throw Error(`The getIotaWallet setting doesn't exist.`);
};

exports.updateWalletAddressKeyIndex = async (address, keyIndex, userId) => {
  await admin
    .firestore()
    .collection("settings")
    .doc("settings")
    .set({ wallet: { address, keyIndex } }, { merge: true });
  return true;
};

exports.getSettings = async () => {
  // Get settings
  const doc = await admin.firestore().collection("settings").doc("settings").get();
  if (doc.exists) {
    return doc.data();
  }

  const message = "getSettings failed. Setting does not exist";
  console.error(message, doc);
  throw Error(message);
};

exports.getDevice = async (userId, deviceId) => {
  // Get user's device
  const devicesSnapshot = await admin.firestore().collection(`users/${userId}/devices`).doc(deviceId).get();

  if (!devicesSnapshot.exists) {
    const message = "getDevice failed. Device does not exist";
    console.error(message, devicesSnapshot);
    return { error: message };
  }

  const device = devicesSnapshot.data();
  delete device.publicKey;
  delete device.key;
  if (device.wallet) {
    delete device.wallet.seed;
    delete device.wallet.keyIndex;
  }

  // Get device's events
  const transactionsSnapshot = await admin
    .firestore()
    .collection(`events/${userId}/devices/${deviceId}/transactions/`)
    .get();

  const transactions = {};
  const promises = [];
  transactionsSnapshot.forEach((transactionSnapshot) => {
    if (transactionSnapshot.exists) {
      const transaction = transactionSnapshot.data();

      if (transaction.transactionId) {
        promises.push({ [transaction.transactionId]: transactionSnapshot.ref.collection("events").get() });
      }
    }
  });

  for await (const promiseObj of promises) {
    const transactionId = Object.keys(promiseObj)[0];

    const eventsRef = await promiseObj[transactionId];
    if (eventsRef.size > 0) {
      const events = eventsRef.docs.filter((event) => event.exists).map((event) => event.data());

      transactions[transactionId] = events;
    }
  }

  return { device: { ...device, transactions } };
};

exports.logMessage = async (userId, deviceId, messages) => {
  const timestamp = new Date().toLocaleString().replace(/\//g, ".");

  // Save logs by user and device
  await admin
    .firestore()
    .collection(`logs/${userId}/devices/${deviceId}/log`)
    .doc(timestamp)
    .set(
      {
        ...messages.map((message) => message),
        timestamp,
      },
      { merge: true }
    );

  return true;
};

exports.logEvent = async (userId, deviceId, transactionId, event) => {
  const timestamp = new Date().toLocaleString().replace(/\//g, ".");

  // Save logs by user and device
  await admin.firestore().collection(`events/${userId}/devices/${deviceId}/transactions/${transactionId}`).set(
    {
      transactionId,
      timestamp,
    },
    { merge: true }
  );

  // Save logs by user and device
  await admin
    .firestore()
    .collection(`events/${userId}/devices/${deviceId}/transactions/${transactionId}/events`)
    .doc(timestamp)
    .set(
      {
        ...event,
        timestamp,
      },
      { merge: true }
    );

  return true;
};
