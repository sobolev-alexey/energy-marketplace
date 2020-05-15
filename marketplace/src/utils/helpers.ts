import { trytesToAscii } from '@iota/converter';
import * as crypto from 'crypto';

export const decodeMessage = transaction => {
    // Modify to consumable length
    if (!transaction.length || !transaction?.[0].signatureMessageFragment) {
        return null;
    }
    const fragment = transaction?.[0].signatureMessageFragment;
    const trytes = fragment % 2 !== 0 ? `${fragment}9` : fragment;

    // Decode message
    return trytesToAscii(trytes);
};

export const getNumberFromLetter = letter => {
    return letter.charCodeAt(0) - 65;
};

export const getHash = (message: string | object) => {
    const hasher: crypto.Hash = crypto.createHash('sha256');
    hasher.update(typeof message === 'string' ? message : JSON.stringify(message, null, 2));
    return hasher.digest('base64');
};
