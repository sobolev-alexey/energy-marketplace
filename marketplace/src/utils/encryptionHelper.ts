import NodeRSA from 'node-rsa';

export interface IKeys { 
    publicKey: string; 
    privateKey: string;
}

export interface IMessagePayload { 
    message: any; 
    signature: Buffer;
    mam?: object;
}

export interface IReceivedMessagePayload { 
    message: any; 
    signature: ISignature; 
    mam?: object;
}

interface ISignature { 
    data: Uint8Array;
    type: string;
}

const keySize = 2048;

export class EncryptionService {
    public generateKeys(): IKeys {
        try {
            const rsaKeypair: NodeRSA = new NodeRSA({ b: keySize });
            // rsaKeypair.generateKeyPair();
            if (rsaKeypair.getKeySize() === keySize && 
                rsaKeypair.getMaxMessageSize() >= Math.round(keySize / 10) &&
                rsaKeypair.isPrivate() &&
                rsaKeypair.isPublic()
            ) {
                return { 
                    publicKey: rsaKeypair.exportKey('public'), 
                    privateKey: rsaKeypair.exportKey('private')
                };
            } else {
                throw new Error('Key generation failed');
            }
        } catch (error) {
            throw new Error(error);
        }
    }

    public publicEncrypt(publicKey: string, message: string): string {
        try {
            const publicKeyInstance = this.getPublicKeyInstance(publicKey);
            return JSON.stringify(
                publicKeyInstance.encrypt(Buffer.from(message))
            );
        } catch (error) {
            throw new Error(error);
        }
    }

    public privateDecrypt(privateKey: string, input: string): IReceivedMessagePayload {
        try {
            const privateKeyInstance = this.getPrivateKeyInstance(privateKey);
            const decrypted = privateKeyInstance.decrypt(
                Buffer.from(JSON.parse(input))
            );
            return JSON.parse(decrypted.toString());
        } catch (error) {
            throw new Error(error);
        }
    }

    public signMessage(privateKey: string, dataToSign: object): Buffer {
        try {
            const privateKeyInstance = this.getPrivateKeyInstance(privateKey);
            return privateKeyInstance.sign(
                Buffer.from(JSON.stringify(dataToSign))
            );
        } catch (error) {
            throw new Error(error);
        }
    }

    public verifySignature(publicKey: string, dataToCheck: object, signatureToVerify: ISignature): boolean {
        try {
            const publicKeyInstance = this.getPublicKeyInstance(publicKey);
            console.log('verifySignature', JSON.stringify(dataToCheck), signatureToVerify?.data);
            return publicKeyInstance.verify(
                Buffer.from(JSON.stringify(dataToCheck)), 
                Buffer.from(signatureToVerify?.data)
            );
        } catch (error) {
            console.log('verifySignature ERROR', error);
            throw new Error(error);
        }
    }

    private getPublicKeyInstance(publicKey: string): NodeRSA {
        try {
            const nodeRSA = new NodeRSA();
            return nodeRSA.importKey(publicKey, 'public');
        } catch (error) {
            throw new Error(error);
        }
    }
    
    private getPrivateKeyInstance(privateKey: string): NodeRSA {
        try {
            const nodeRSA = new NodeRSA();
            return nodeRSA.importKey(privateKey, 'private');
        } catch (error) {
            throw new Error(error);
        }
    }
}
