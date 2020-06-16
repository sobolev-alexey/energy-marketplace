const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

exports.getSettings = async () => {
  // Get settings
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
  return doc.exists ? doc.data() : null;
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

exports.logMessage = async (appId, tripId, messages) => {
  const timestamp = (new Date()).toLocaleString().replace(/\//g, '.');

  // Save logs by user and trip
  await admin
    .firestore()
    .collection(`logs/${appId}/trips/${tripId}/log`)
    .doc(timestamp)
    .set({ 
      ...messages.map(message => message),
      timestamp
    }, { merge: true });

  return true;
};
