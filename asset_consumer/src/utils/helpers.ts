import { trytesToAscii } from '@iota/converter';
import * as crypto from 'crypto';

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
