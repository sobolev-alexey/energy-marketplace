const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const isEmpty = require('lodash/isEmpty');
const { getSettings, getChannelState, storeChannelState, logMessage } = require('./firebase');
const { fetch, publish } = require('./mam');
const { getHash } = require('./helpers');


exports.claim = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const packet = req.body;
      if (!packet || !packet.appId || !packet.tripId) {
        console.error('Claim request failed. Packet: ', packet);
        return res.status(400).json({ 
          status: 'error',
          error: 'Malformed Request' 
        });
      }

      // Retrieve channel state by hash
      const hash = getHash(packet.appId, packet.tripId);
      const settings = await getSettings();
      const channelState = await getChannelState(hash);
      if (channelState && !isEmpty(channelState)) {
        const data = await fetch(packet.appId, packet.tripId, channelState);
        if (settings.enableCloudLogs) {
            // Log success
            const message = `Fetched data for App ID ${packet.appId} and Trip ID ${packet.tripId}`;
            await logMessage(packet.appId, packet.tripId, [message]);
            console.log(message);
        }
        return res.json({
          status: 'success',
          data 
        });
      }

      if (settings.enableCloudLogs) {
        // Log no data
        const message = `Tried to fetch data for App ID ${packet.appId} and Trip ID ${packet.tripId}. This combination was not found`;
        await logMessage(packet.appId, packet.tripId, [message]);
        console.log(message);
      }

      return res.json({ status: 'no data' });

    } catch (error) {
      console.error('Claim request failed. Error: ', error);
      return res.status(403).json({
        status: 'error',
        error: error.message 
      });
    }
  });
});

exports.location = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check Fields
      const packet = req.body;
      if (!packet || !packet.appId || !packet.tripId || !packet.location) {
        console.error('Location request failed. Packet: ', packet);
        return res.status(400).json({ 
          status: 'error',
          error: 'Malformed Request' 
        });
      }

      // Retrieve channel state by hash
      const hash = getHash(packet.appId, packet.tripId);
      const settings = await getSettings();
      const channelState = await getChannelState(hash);
      const newChannelState = await publish(packet.appId, packet.tripId, packet.location, channelState);
      
      if (newChannelState && !isEmpty(newChannelState)) {
        // Store updated channel state.
        await storeChannelState(hash, newChannelState);

        if (settings.enableCloudLogs) {
          // Log success
          const message = `Published new location data for App ID ${packet.appId} and Trip ID ${packet.tripId}`;
          await new Promise(resolve => setTimeout(resolve, 1000));
          await logMessage(packet.appId, packet.tripId, [message]);
          console.log(message);
        }

        return res.json({ status: 'success' });

      }

      // Log failure
      if (settings.enableCloudLogs) {
        const message = `Tried to publish location data for App ID ${packet.appId} and Trip ID ${packet.tripId}.`;
        await logMessage(packet.appId, packet.tripId, [message]);
        console.error(message);
      }

      throw new Error('Data publishing error', newChannelState);

    } catch (error) {
      console.error('Location request failed. Error: ', error);
      return res.status(403).json({ 
        status: 'error',
        error: error.message 
      });
    }
  });
});
