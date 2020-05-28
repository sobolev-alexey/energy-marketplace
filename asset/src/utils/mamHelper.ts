import { composeAPI, LoadBalancerSettings } from '@iota/client-load-balancer';
import { 
    asciiToTrytes,
    trytesToAscii 
} from '@iota/converter';
import {
    createChannel,
    createMessage,
    IMamMessage,
    mamAttach,
    mamFetchAll
} from '@iota/mam.js';
import crypto from 'crypto';
import { chunkSize, defaultDepth, defaultMwm, defaultSecurity, mamMode, tag } from '../config.json';
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
        } else {
            // Set channel mode & update key
            secretKey = generateRandomKey(81);
            mamState = createChannel(generateRandomKey(81), defaultSecurity, MAM_MODE[mamMode], secretKey);
        }

        // Create MAM Payload - STRING OF TRYTES
        const trytes: string = asciiToTrytes(JSON.stringify(packet));
        const message: IMamMessage = createMessage(mamState, trytes);
        const bundle = await mamAttach(api, message, defaultDepth, defaultMwm, tag);
        const root = mamStateFromDB?.root ? mamStateFromDB?.root : message?.root;

        // Attach the payload
        if (bundle && bundle.length && bundle?.[0].hash) {

            // Check if the message was attached
            await checkAttachedMessage(api, root, secretKey);

            // Save new mamState
            await writeData('mam', { ...mamState, transactionId, root });
            return { ...mamState, transactionId, root };
        }
        return null;
    } catch (error) {
        console.log('MAM publish', error);
        throw new Error(error);
    }
};

const checkAttachedMessage = async (api, root, secretKey) => {
    let retries = 0;

    while (retries++ < 10) {
        const fetched = await mamFetchAll(api, root, MAM_MODE[mamMode], secretKey, chunkSize);
        const result = [];
        
        if (fetched && fetched.length > 0) {
            for (let i = 0; i < fetched.length; i++) {
                result.push(trytesToAscii(fetched[i].message));
            }
        }

        if (result.length > 0) {
            return result.length;
        }
        console.log('In MAM loop');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
};

export const fetch = async (transactionId: string) => {
    try {
        const config: any = await readData('asset');
        const loadBalancerSettings = ServiceFactory.get<LoadBalancerSettings>(
            `${config?.network}-load-balancer-settings`
        );
        const api = composeAPI(loadBalancerSettings);

        const channelState: any = await readData('mam', 'transactionId', transactionId);
        const fetched = await mamFetchAll(api, channelState.root, channelState.mode, channelState.sideKey, chunkSize);
        const result = [];
        
        if (fetched && fetched.length > 0) {
            for (let i = 0; i < fetched.length; i++) {
                result.push(trytesToAscii(fetched[i].message));
            }
        }
        return result;
    } catch (error) {
        console.error('MAM fetch', error);
        throw new Error(error);
    }
};
