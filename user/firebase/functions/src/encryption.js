const NodeRSA = require('node-rsa');

const keySize = 2048;

exports.EncryptionService = () => {
    return {
        generateKeys() {
            try {
                const rsaKeypair = new NodeRSA({ b: keySize });
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
        },

        publicEncrypt(publicKey, message) {
            try {
                const publicKeyInstance = this.getPublicKeyInstance(publicKey);
                return JSON.stringify(
                    publicKeyInstance.encrypt(Buffer.from(message))
                );
            } catch (error) {
                throw new Error(error);
            }
        },

        privateDecrypt(privateKey, input) {
            try {
                const privateKeyInstance = this.getPrivateKeyInstance(privateKey);
                const decrypted = privateKeyInstance.decrypt(
                    Buffer.from(JSON.parse(input))
                );
                return JSON.parse(decrypted.toString());
            } catch (error) {
                throw new Error(error);
            }
        },

        signMessage(privateKey, dataToSign) {
            try {
                const privateKeyInstance = this.getPrivateKeyInstance(privateKey);
                return privateKeyInstance.sign(
                    Buffer.from(JSON.stringify(dataToSign))
                );
            } catch (error) {
                throw new Error(error);
            }
        },

        verifySignature(publicKey, dataToCheck, signatureToVerify) {
            try {
                const publicKeyInstance = this.getPublicKeyInstance(publicKey);
                return publicKeyInstance.verify(
                    Buffer.from(JSON.stringify(dataToCheck)), 
                    signatureToVerify && Buffer.from(signatureToVerify.data)
                );
            } catch (error) {
                throw new Error(error);
            }
        },

        getPublicKeyInstance(publicKey) {
            try {
                const nodeRSA = new NodeRSA();
                return nodeRSA.importKey(publicKey, 'public');
            } catch (error) {
                throw new Error(error);
            }
        },
        
        getPrivateKeyInstance(privateKey) {
            try {
                const nodeRSA = new NodeRSA();
                return nodeRSA.importKey(privateKey, 'private');
            } catch (error) {
                throw new Error(error);
            }
        }
    }
}
