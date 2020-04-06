import * as crypto from 'crypto';
import * as cryptoJS from 'crypto-js';
import * as ecies from 'eciesjs';
import * as secp256k1 from 'secp256k1';

export interface IKeys { 
    publicKey: string; 
    privateKey: string;
}

export interface IMessagePayload { 
    message: string; 
    signature: string; 
}

interface ISignature { 
    signature: Uint8Array;
    recovery: number;
}

export class EncryptionService {
    public generateKeys(): IKeys {
        try {
            let privateKey: Buffer;
            let publicKey: Buffer;

            do {
                privateKey = crypto.randomBytes(32);
            } while (!secp256k1.privateKeyVerify(privateKey));
        
            const publicKeyArray: Uint8Array = secp256k1.publicKeyCreate(privateKey);
            if (secp256k1.publicKeyVerify(publicKeyArray)) {
                publicKey = Buffer.from(publicKeyArray);
            }

            return { 
                publicKey: JSON.stringify(publicKey), 
                privateKey: JSON.stringify(privateKey)
            };
        } catch (error) {
            throw new Error(error);
        }
    }

    public publicEncrypt(publicKey: string, message: string): Buffer {
        try {
            return ecies.encrypt(this.jsonStringToBuffer(publicKey), Buffer.from(message));
        } catch (error) {
            throw new Error(error);
        }
    }

    public privateDecrypt(privateKey: string, input: Buffer): IMessagePayload {
        try {
            const decrypted = ecies.decrypt(this.jsonStringToBuffer(privateKey), input);
            return JSON.parse(decrypted.toString());
        } catch (error) {
            throw new Error(error);
        }
    }

    public signMessage(privateKey: string, dataToSign: string): string {
        try {
            const hashedData: Uint8Array = this.hash(dataToSign);
            const signatureObj: ISignature = secp256k1.ecdsaSign(
                hashedData, this.jsonStringToBuffer(privateKey)
            );
            return this.uint8ArrayToJSONString(signatureObj?.signature);
        } catch (error) {
            throw new Error(error);
        }
    }

    public verifySignature(publicKey: string, dataToCheck: string, signatureToVerify: string): boolean {
        try {
            const hashedData: Uint8Array = this.hash(dataToCheck);
            return secp256k1.ecdsaVerify(
                this.jsonStringToUint8Array(signatureToVerify), hashedData, this.jsonStringToBuffer(publicKey)
            );
        } catch (error) {
            throw new Error(error);
        }
    }

    private uint8ArrayToJSONString(array: Uint8Array): string {
        try {
            return JSON.stringify(Buffer.from(array));
        } catch (error) {
            throw new Error(error);
        }
    }

    private jsonStringToUint8Array(message: string): Uint8Array {
        try {
            return Uint8Array.from(Buffer.from(JSON.parse(message)?.data));
        } catch (error) {
            throw new Error(error);
        }
    }

    private jsonStringToBuffer(message: string): Buffer {
        try {
            return Buffer.from(JSON.parse(message)?.data);
        } catch (error) {
            throw new Error(error);
        }
    }

    private hash(message: string): Uint8Array {
        try {
            const hash = cryptoJS.SHA256(message);
            const buffer = Buffer.from(hash.toString(cryptoJS.enc.Hex), 'hex');
            return new Uint8Array(buffer);
        } catch (error) {
            throw new Error(error);
        }
    }
}
