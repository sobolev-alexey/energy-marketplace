const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

exports.getSettings = async () => {
  // Get data
  const doc = await admin
    .firestore()
    .collection('settings')
    .doc('settings')
    .get();
  if (doc.exists) {
    const { enableCloudLogs, nodes, tangle } = doc.data();
    return { enableCloudLogs, nodes, tangle };
  }
  const message = 'getSettings failed. Setting does not exist';
  console.error(message, doc);
  throw Error(message);
};

exports.getChannelState = async hash => {
  // Get getChannelState by hash
  const doc = await admin
    .firestore()
    .collection('mamChannelState')
    .doc(hash)
    .get();
  if (doc.exists) return doc.data();
  const message = 'getChannelState failed. Hash not found.';
  console.error(message, key, doc);
  throw Error(message);
};

exports.storeChannelState = async (hash, newChannelState) => {
  // Store new newChannelState  by hash
  await admin
    .firestore()
    .collection('mamChannelState')
    .doc(hash)
    .set({ 
      timestamp: (new Date()).toLocaleString(),
      ...newChannelState
    }, { merge: true });
  return true;
};

exports.logMessage = async (appId, tripId, message) => {
  // Save logs by user and trip
  await admin
    .firestore()
    .collection('logs')
    .doc(appId)
    .collection('trips')
    .doc(tripId)
    .collection('logs')
    .doc((new Date()).toLocaleString())
    .set({
      timestamp: (new Date()).toLocaleString(),
      message
    }, { merge: true });

  return true;
};
