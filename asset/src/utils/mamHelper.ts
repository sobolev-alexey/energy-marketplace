import { composeAPI, LoadBalancerSettings } from '@iota/client-load-balancer';
import { 
    asciiToTrytes
    // trytesToAscii 
} from '@iota/converter';
import {
    createChannel,
    createMessage,
    IMamMessage,
    mamAttach
    // mamFetchAll,
} from '@iota/mam.js';
import crypto from 'crypto';
import { defaultDepth, defaultMwm, defaultSecurity, mamMode, tag } from '../config.json';
import { ServiceFactory } from '../factories/serviceFactory';
import { readData, writeData } from './databaseHelper';

// An enumerator for the different MAM Modes. Prevents typos in regards to the different modes.
export enum MAM_MODE {
    PRIVATE = 'private',
    PUBLIC = 'public',
    RESTRICTED = 'restricted'
}

export interface IMamState {
    id?: string;
    seed: string;
    mode: MAM_MODE;
    sideKey: string;
    security: number;
    start: number;
    count: number;
    nextCount: number;
    index: number;
    nextRoot: string;
}

// Random Key Generator
const generateRandomKey = length => {
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

// Publish to tangle
export const publish = async (transactionId, packet) => {
    try {
        let mamState;
        let secretKey;

        const config: any = await readData('asset');
        const loadBalancerSettings = ServiceFactory.get<LoadBalancerSettings>(
            `${config?.network}-load-balancer-settings`
        );
        const api = composeAPI(loadBalancerSettings);
        const mamStateFromDB: any = await readData('mam', 'transactionId', transactionId);

        if (mamStateFromDB) {
            secretKey = mamStateFromDB?.sideKey;
            mamState = mamStateFromDB;
            mamState.index = mamStateFromDB?.keyIndex;
            console.log('RETRIEVED MAM state', mamState);
        } else {
            // Set channel mode & update key
            secretKey = generateRandomKey(81);
            mamState = createChannel(generateRandomKey(81), defaultSecurity, MAM_MODE[mamMode], secretKey);
            console.log('INITIAL MAM state', mamState);

        }

        // Create MAM Payload - STRING OF TRYTES
        const trytes: string = asciiToTrytes(JSON.stringify(packet));
        const message: IMamMessage = createMessage(mamState, trytes);
        const bundle = await mamAttach(api, message, defaultDepth, defaultMwm, tag);
        const root = mamStateFromDB && mamStateFromDB?.root ? mamStateFromDB.root : message.root;

        // Attach the payload
        if (bundle && bundle.length && bundle[0].hash) {
            // Save new mamState
            await writeData('mam', { transactionId, root, ...mamState });
            return { hash: bundle[0].hash, root, secretKey };
        }
        return null;
    } catch (error) {
        console.log('MAM publish', error);
        throw new Error(error);
    }
};

// export const fetchFromRoot = async (root, secretKey) => {
//     // Output syncronously once fetch is completed
//     const mode = 'restricted';
//     const result = await Mam.fetch(root, mode, secretKey);
//     return result && result.messages.map(message => JSON.parse(trytesToAscii(message)));
// };

// export const fetchFromChannelId = async channelId => {
//     const channelData: IMamState = await readData('mam', channelId);
//     if (channelData) {
//         return await fetchFromRoot(channelData.root, channelData.side_key);
//     }
//     return [];
// };
