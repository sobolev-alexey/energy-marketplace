import { asciiToTrytes, trytesToAscii, TRYTE_ALPHABET } from '@iota/converter';
import * as crypto from 'crypto';
import { TextHelper } from './textHelper';

/**
 * Helper functions for use with trytes.
 */
export class TrytesHelper {
    /**
     * Convert an object to Trytes.
     * @param obj The obj to encode.
     * @returns The encoded trytes value.
     */
    public static toTrytes(obj: any): string {
        const json = JSON.stringify(obj);
        const encoded = TextHelper.encodeNonASCII(json);
        return encoded ? asciiToTrytes(encoded) : '';
    }

    /**
     * Convert an object from Trytes.
     * @param trytes The trytes to decode.
     * @returns The decoded object.
     */
    public static fromTrytes<T>(trytes: string): T {
        // Trim trailing 9s
        let trimmed = trytes.replace(/\9+$/, '');

        // And make sure it is even length (2 trytes per ascii char)
        if (trimmed.length % 2 === 1) {
            trimmed += '9';
        }

        const ascii = trytesToAscii(trimmed);
        const json = TextHelper.decodeNonASCII(ascii);

        return json ? JSON.parse(json) : undefined;
    }

    /**
     * Convert trytes to a number.
     * @param trytes The trytes string to convert
     * @returns The numeric value of the trytes or zero.
     */
    public static toNumber(trytes: string): number {
        return trytes ? parseInt(trytesToAscii(trytes), 10) : 0;
    }

    /**
     * Convert number to trytes.
     * @param val The number to convert.
     * @returns The trytes of the number.
     */
    public static fromNumber(val: number): string {
        return asciiToTrytes(Math.floor(val).toString());
    }

    /**
     * Generate a random hash.
     * @param length The length of the hash.
     * @returns The hash.
     */
    public static generateHash(length: number = 81): string {
        let hash = '';

        const randomValues = new Uint32Array(crypto.randomBytes(length));

        for (let i = 0; i < length; i++) {
            hash += TRYTE_ALPHABET.charAt(randomValues[i] % 27);
        }

        return hash;
    }
}
