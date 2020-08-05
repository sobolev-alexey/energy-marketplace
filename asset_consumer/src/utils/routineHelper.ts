import { readData } from './databaseHelper';
import { log } from './loggerHelper';
import { publish } from './mamHelper';
import { EncryptionService, IMessagePayload, IReceivedMessagePayload } from './encryptionHelper';
import { sendRequest } from './communicationHelper';
import { IWallet } from '../models/wallet/IWallet';

export async function decryptVerify(request: any): Promise<{ verificationResult: boolean, message?: any }> {
    try {
        if (request && request?.encrypted) {
            const asset: any = await readData('asset');
            const keys: any = await readData('keys');
            if (asset && keys && keys.privateKey) {
                const encryptionService = new EncryptionService();

                const decrypted: IReceivedMessagePayload = encryptionService.privateDecrypt(
                    keys.privateKey, request?.encrypted
                );
    
                const verificationResult: boolean = encryptionService.verifySignature(
                    asset?.marketplacePublicKey, decrypted?.message, decrypted?.signature
                );  
                    
                const contractId = decrypted?.message?.contractId;
                if (verificationResult) {
                    await log(`Marketplace signature verification successful. ${contractId}`);
                    return { verificationResult: true, message: decrypted?.message };
                }
                await log(`Marketplace signature verification failed. ${contractId}`);
                return { verificationResult: false };
            }
            await log(`No asset key`);
            throw new Error('No asset key');
        } else {
            await log(`No encrypted payload found`);
            throw new Error('No encrypted payload found');
        }
    } catch (error) {
        await log(`decryptVerify failed. ${error.toString()}`);
        throw new Error(error);
    }
}

export async function signPublishEncryptSend(payload: any, endpoint: string): Promise<{success: boolean}> {
    try {
        const asset: any = await readData('asset');

        if (asset) {
            // Retrieve encryption keys
            const keys: any = await readData('keys');
            if (!keys || !keys.privateKey) {
                throw new Error('No keypair found in database');
            }

            // Log event 
            await log(`signPublishEncryptSend for ${endpoint}: ${payload?.contractId}`);

            // Sign payload
            const encryptionService = new EncryptionService();
            const signature: Buffer = encryptionService.signMessage(
                keys?.privateKey, payload
            );

            const transactionId = asset?.type === 'provider' 
                ? payload?.providerTransactionId 
                : payload?.requesterTransactionId;

            let mam;
            let publicKey;

            console.log('signPublishEncryptSend 1', endpoint, payload);
            if (endpoint === 'fund' || endpoint === 'notify_event') {
                // Get existing MAM channel details
                mam = await readData('mam', 'transactionId', transactionId);
                publicKey = asset?.assetOwnerPublicKey;
            } else {
                // Publish payload to MAM and return channel details
                mam = await publish(transactionId, { message: payload, signature });
                publicKey = asset?.marketplacePublicKey;
            }

            // Encrypt payload and signature with asset's public key
            const messagePayload: IMessagePayload = { message: payload, signature, mam };
            const encrypted: string = encryptionService.publicEncrypt(
                publicKey, JSON.stringify(messagePayload)
            );

            // Send encrypted payload and signature to asset
            const requestPayload: { encrypted: string; userId?: string; keyIndex?: number; } = { encrypted };
            if (endpoint === 'fund' || endpoint === 'notify_event') {
                const wallet: IWallet = await readData('wallet');
                requestPayload.keyIndex = wallet?.keyIndex;
                requestPayload.userId = asset.assetOwner;
                console.log('signPublishEncryptSend 1.5', requestPayload.userId);
            }
            console.log('signPublishEncryptSend 2', endpoint, mam);

            return await sendRequest(endpoint, requestPayload);
        }
    } catch (error) {
        console.error('signPublishEncryptSend', error);
        await log(`signPublishEncryptSend Error ${error.toString()}`);
        return null;
    }
}
