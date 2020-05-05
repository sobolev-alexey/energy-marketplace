import { readData, writeData } from '../utils/databaseHelper';
import { log, transactionLog } from '../utils/loggerHelper';
import { fetch } from '../utils/mamHelper';
import { HttpError } from '../errors/httpError';
import { EncryptionService, IReceivedMessagePayload } from '../utils/encryptionHelper';
import { sendRequest } from '../utils/communicationHelper';

export async function offerOrRequest(_: any, requestDetails: any): Promise<any> {
    try {
        if (requestDetails && requestDetails?.encrypted) {
            const keys: any = await readData('keys');

            if (keys && keys.privateKey) {
                const encryptionService = new EncryptionService();

                const decrypted: IReceivedMessagePayload = encryptionService.privateDecrypt(
                    keys.privateKey, requestDetails?.encrypted
                );
    
                const asset: any = await readData('asset', 'assetId', decrypted?.message?.assetId);

                if (asset) {
                    await writeData('mam', decrypted?.mam);

                    const verificationResult: boolean = encryptionService.verifySignature(
                        asset?.assetPublicKey, decrypted?.message, decrypted?.signature
                    );  

                    if (verificationResult) {
                        const mamFetchResults = await fetch(asset.assetId, decrypted?.message.transactionId);
                                                
                        if (mamFetchResults.length > 0) {
                            let mamFetchLastMessage = mamFetchResults.length > 0 && mamFetchResults[mamFetchResults.length - 1];
                            mamFetchLastMessage = JSON.parse(mamFetchLastMessage);
        
                            if (mamFetchLastMessage && mamFetchLastMessage?.signature) {
                                const mamVerificationResult: boolean = encryptionService.verifySignature(
                                    asset?.assetPublicKey, mamFetchLastMessage?.message, mamFetchLastMessage?.signature
                                );
                                if (!mamVerificationResult || mamFetchLastMessage?.message?.transactionId !== decrypted?.message?.transactionId) {
                                    await log(`Asset signature verification from MAM failed. ${asset.assetId}`);
                                    throw new HttpError('Asset signature verification from MAM failed', 404);
                                } 
                            } else {
                                await log(`MAM signature not found. ${asset.assetId}`);
                                throw new HttpError('MAM signature not found', 404);
                            }
                        } else {
                            await log(`MAM stream can't be fetched. ${asset.assetId}`);
                            throw new HttpError(`MAM stream can't be fetched`, 404);
                        }

                        await transactionLog(decrypted?.message);
                        const payload = (({ assetId, transactionId, timestamp, energyAmount, energyPrice }) => 
                            ({ assetId, transactionId, timestamp, energyAmount, energyPrice }))(decrypted?.message);
                        // tslint:disable-next-line:no-unnecessary-local-variable
                        const bidManagerResponse = await sendRequest(decrypted?.message.type, payload);

                        return bidManagerResponse;
                    }
                    await log(`Asset signature verification failed. ${asset.assetId}`);
                    throw new HttpError('Asset signature verification failed', 404);
                }
                await log(`Asset not registered. ${decrypted?.message?.assetId}`);
                throw new HttpError('Asset not registered', 404);
            }
            await log(`No marketplace key`);
            throw new HttpError('No marketplace key', 404);
        } else {
            await log(`No encrypted payload found`);
            throw new HttpError('No encrypted payload found', 404);
        }
    } catch (error) {
        await log(`Offer/Request creation failed. ${error.toString()}`);
        throw new Error(error);
    }
}
