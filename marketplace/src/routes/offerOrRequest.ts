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
                    const mamFetchResults = await fetch(asset.assetId, decrypted?.message.transactionId);
                    let mamFetchLastMessage = mamFetchResults.length > 0 && mamFetchResults[mamFetchResults.length - 1];
                    mamFetchLastMessage = JSON.parse(mamFetchLastMessage);

                    const verificationResult: boolean = encryptionService.verifySignature(
                        asset?.assetPublicKey, decrypted?.message, decrypted?.signature
                    );  

                    const mamVerificationResult: boolean = encryptionService.verifySignature(
                        asset?.assetPublicKey, mamFetchLastMessage?.message, mamFetchLastMessage?.signature
                    );  
                    console.log(4444, mamFetchResults.length, mamVerificationResult);
        
                    if (verificationResult 
                        //  && mamVerificationResult 
                        //  && mamFetchLastMessage?.message?.transactionId === decrypted?.message?.transactionId
                    ) {
                        await transactionLog(decrypted?.message);
                        const payload = (({ assetId, transactionId, timestamp, energyAmount, energyPrice }) => 
                            ({ assetId, transactionId, timestamp, energyAmount, energyPrice }))(decrypted?.message);
                        const match = await sendRequest(decrypted?.message.type, payload);
                        return { success: true };
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
