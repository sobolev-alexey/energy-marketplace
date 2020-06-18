const crypto = require('crypto');
const isEmpty = require('lodash/isEmpty');
const { composeAPI, FailMode, RandomWalkStrategy, SuccessMode } = require('@iota/client-load-balancer');
const { asciiToTrytes, trytesToAscii } = require('@iota/converter')
const { createChannel, createMessage, mamAttach, mamFetchAll } = require('@iota/mam.js');
const { getSettings, logMessage } = require('./firebase');

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
    tryNodeCallback: (node) => {
      console.log(`Trying node ${node.provider}`);
    },
    failNodeCallback: (node, err) => {
      console.error(`Failed node ${node.provider}, ${err.message}`);
    }
  });
  
  return api;
};

const publish = async (appId, tripId, payload, currentState = null) => {
  const settings = await getSettings();
  if (!settings || isEmpty(settings.tangle) || !settings.nodes.length) {
    const settingsErrorMessage = 'Settings not defined';
    console.error(settingsErrorMessage);
    throw new Error(settingsErrorMessage);
  }

  try {
    // Setup the details for the channel.
    const { depth, mwm, mamMode, security, tag } = settings.tangle;
    const sideKey = mamMode === 'restricted' ? generateSeed() : undefined;
    let channelState = currentState;

    // If we haven't received existing channel details then create a new channel.
    if (!channelState || isEmpty(channelState)) {
      channelState = createChannel(generateSeed(), security, mamMode, sideKey);
    }

    // Create a MAM message using the channel state.
    const mamMessage = createMessage(channelState, asciiToTrytes(JSON.stringify(payload)));
    const root = currentState ? currentState.root : mamMessage.root;
    channelState.root = root;

    const messages = [];
    if (settings.enableCloudLogs) {
      const attachMessage = `Attaching to Tangle, please wait... ${root}`;
      messages.push(attachMessage);
      console.log(attachMessage);
    }

    // Attach the message.    
    const api = await getApi(settings);
    const bundle = await mamAttach(api, mamMessage, depth, mwm, tag);
    const bundleHash = bundle && bundle.length && bundle[0].hash;
    channelState.bundleHash = bundleHash;

    if (settings.enableCloudLogs) {
      // Log success
      const message = `You can view the MAM channel here https://utils.iota.org/mam/${root}/${mamMode}/${sideKey}/devnet`;
      messages.push(message);
      console.log(message);

      if (bundleHash) {
        const bundleMessage = `Bundle hash: ${bundleHash}`;
        messages.push(bundleMessage);
        console.log(bundleMessage);
      }

      await logMessage(appId, tripId, messages);
    }

    return channelState;

  } catch (attachError) {
    const attachErrorMessage = 'MAM attach message failed';
    console.error(attachErrorMessage, attachError);
    throw new Error(attachErrorMessage, attachError);
  }
}

const fetch = async (appId, tripId, channelState) => {
  const settings = await getSettings();
  if (!settings || isEmpty(settings.tangle) || !settings.nodes.length) {
    const settingsErrorMessage = 'Settings not defined';
    console.error(settingsErrorMessage);
    throw new Error(settingsErrorMessage);
  }

  try {
    // Setup the details for the channel.
    const { mamMode, mamFetchStreams } = settings.tangle;
    const { root, sideKey } = channelState;
    const api = await getApi(settings);

    settings.enableCloudLogs && console.log('Fetching from Tangle, please wait...', root);

    const fetched = await mamFetchAll(api, root, mamMode, sideKey, mamFetchStreams);
    const result = [];
        
    if (fetched && fetched.length > 0) {
        for (let i = 0; i < fetched.length; i++) {
          fetched[i] && fetched[i].message && 
          result.push(JSON.parse(trytesToAscii(fetched[i].message)));
        }
    }
    
    if (settings.enableCloudLogs) {
      if (result.length) {
        // Log success
        const message = `Fetched from ${root}: ${result.length}`;
        await logMessage(appId, tripId, [message]);
        console.log(message);
      } else {
        const message = `Nothing was fetched from the MAM channel ${root}`;
        await logMessage(appId, tripId, [message]);
        console.error(message);
      }
    }

    return result;

  } catch (fetchError) {
    const fetchErrorMessage = 'MAM fetch message failed';
    console.error(fetchErrorMessage, fetchError);
    throw new Error(fetchErrorMessage, fetchError);
  }
}

module.exports = {
  fetch,
  publish
}