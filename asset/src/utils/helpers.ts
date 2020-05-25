import { trytesToAscii } from '@iota/converter';
import * as crypto from 'crypto';
import { maxPendingDurationHours } from '../config.json';

export const decodeMessage = fragment => {
    // Modify to consumable length
    if (!fragment) {
        return null;
    }
    const trytes = fragment % 2 !== 0 ? `${fragment}9` : fragment;

    // Decode message
    return trytesToAscii(trytes).replace(/\u0000/gi, '');
};

export const getNumberFromLetter = letter => {
    return letter.charCodeAt(0) - 65;
};

export const getHash = (message: string | object) => {
    const hasher: crypto.Hash = crypto.createHash('sha256');
    hasher.update(typeof message === 'string' ? message : JSON.stringify(message, null, 2));
    return hasher.digest('base64');
};

export const getMaxAllowedTimestamp = () => {
    const currentTimestamp = Date.now();
    const maxAllowedPendingTime = maxPendingDurationHours * 3600000; // Milliseconds in 1 hour multiplied by hours
    return currentTimestamp - maxAllowedPendingTime;
};
