import { readData, writeData } from './databaseHelper';
import { log } from './loggerHelper';
import { fetch, publish } from './mamHelper';
import { EncryptionService, IMessagePayload, IReceivedMessagePayload } from './encryptionHelper';
import { sendRequest } from './communicationHelper';

export async function decryptVerify(request: any): Promise<{
    verificationResult: boolean;
    message?: any;
    asset?: any;
}> {
    try {
        if (request && request?.encrypted) {
            const keys: any = await readData('keys');
            if (keys && keys.privateKey) {
                const encryptionService = new EncryptionService();

                const decrypted: IReceivedMessagePayload = encryptionService.privateDecrypt(
                    keys.privateKey, request?.encrypted
                );
    
                const assetId = decrypted?.message?.type === 'request' 
                    ? decrypted?.message?.requesterId 
                    : decrypted?.message?.providerId ;
                const asset: any = await readData('asset', 'assetId', assetId);

                console.log('decryptVerify 01', assetId, decrypted?.message?.type);
                console.log('decryptVerify 02', asset);
                console.log('decryptVerify 03', decrypted?.message);

                if (asset) {
                    await writeData('mam', decrypted?.mam);

                    const verificationResult: boolean = encryptionService.verifySignature(
                        asset?.assetPublicKey, decrypted?.message, decrypted?.signature
                    );  

                    console.log('decryptVerify 04', verificationResult);

                    if (verificationResult) {
                        await log(`Asset signature verification successful. ${assetId}`);

                        const transactionId = decrypted?.message?.type === 'request' 
                            ? decrypted?.message?.requesterTransactionId 
                            : decrypted?.message?.providerTransactionId;
                        const mamFetchResults = await fetch(assetId, transactionId);
                                                
                        if (mamFetchResults.length > 0) {
                            let mamFetchLastMessage = mamFetchResults.length > 0 && mamFetchResults[mamFetchResults.length - 1];
                            mamFetchLastMessage = JSON.parse(mamFetchLastMessage);

                            if (mamFetchLastMessage && mamFetchLastMessage?.signature) {
                                const mamVerificationResult: boolean = encryptionService.verifySignature(
                                    asset?.assetPublicKey, mamFetchLastMessage?.message, mamFetchLastMessage?.signature
                                );

                                const mamTransactionId = mamFetchLastMessage?.message?.type === 'request' 
                                    ? mamFetchLastMessage?.message?.requesterTransactionId 
                                    : mamFetchLastMessage?.message?.providerTransactionId;
                                
                                if (!mamVerificationResult || mamTransactionId !== transactionId) {
                                    await log(`Asset signature verification from MAM failed. ${assetId}`);
                                    // throw new Error('Asset signature verification from MAM failed');
                                } 
                            } else {
                                await log(`MAM signature not found. ${assetId}`);
                                throw new Error('MAM signature not found');
                            }
                        } else {
                            await log(`MAM stream can't be fetched. ${assetId}`);
                            throw new Error(`MAM stream can't be fetched`);
                        }
                        return { verificationResult: true, message: decrypted?.message };
                    }
                    await log(`Asset signature verification failed. ${assetId}`);
                    return { verificationResult: false };
                }
                await log(`No asset found`);
                throw new Error('No asset found');
            }
            await log(`No marketplace key`);
            throw new Error('No marketplace key');
        } else {
            await log(`No encrypted payload found`);
            throw new Error('No encrypted payload found');
        }
    } catch (error) {
        await log(`decryptVerify failed. ${error.toString()}`);
        throw new Error(error);
    }
}

export async function signPublishEncryptSend(
    payload: object, 
    assetId: string,
    transactionId: string,
    endpoint: string
): Promise<{success: boolean}> {
    try {
        const asset: any = await readData('asset', 'assetId', assetId);

        if (asset) {
            // Retrieve encryption keys
            const keys: any = await readData('keys');
            if (!keys || !keys.privateKey) {
                throw new Error('No keypair found in database');
            }

            // Sign payload
            const encryptionService = new EncryptionService();
            const signature: Buffer = encryptionService.signMessage(
                keys?.privateKey, payload
            );

            // Publish payload to MAM
            console.log('signPublishEncryptSend 00', assetId, `${asset?.assetURL}/${endpoint}`);
            console.log('signPublishEncryptSend 01', transactionId, payload);
            const mam = await publish(transactionId, { message: payload, signature });
            console.log('signPublishEncryptSend 02', mam);

            // Encrypt payload and signature with asset's public key
            const messagePayload: IMessagePayload = { message: payload, signature, mam };
            // console.log(444, messagePayload);

            const encrypted: string = encryptionService.publicEncrypt(
                asset?.assetPublicKey, JSON.stringify(messagePayload)
            );

            console.log('signPublishEncryptSend 03', asset);

            // Send encrypted payload and signature to asset
            // tslint:disable-next-line:no-unnecessary-local-variable
            const response = await sendRequest(`${asset?.assetURL}/${endpoint}`, { encrypted });
            console.log('signPublishEncryptSend 04', response);

            return response;
        }
    } catch (error) {
        console.error('signPublishEncryptSend', error);
        await log(`signPublishEncryptSend Error ${error.toString()}`);
        return null;
    }
}
