import { readData, writeData } from '../utils/databaseHelper';
import { log } from '../utils/loggerHelper';
import { HttpError } from '../errors/httpError';
import { EncryptionService, IReceivedMessagePayload } from '../utils/encryptionHelper';

export async function register(_: any, request: any): Promise<any> {
    try {
        if (request && request?.encrypted) {
            const keys: any = await readData('keys');
            if (keys && keys.privateKey) {
                const encryptionService = new EncryptionService();

                const decrypted: IReceivedMessagePayload = encryptionService.privateDecrypt(
                    keys.privateKey, request?.encrypted
                );
    
                const verificationResult: boolean = encryptionService.verifySignature(
                    decrypted?.message?.assetPublicKey, decrypted?.message, decrypted?.signature
                );  
                    
                const assetId = decrypted?.message?.assetId;
                if (verificationResult) {
                    const asset: any = await readData('asset', 'assetId', assetId);

                    if (asset) {
                        await log(`Asset already exists. ${assetId}`);
                        return { success: true };
                    }

                    await writeData('asset', decrypted?.message);
                    await log(`Asset registration successful. ${assetId}`);
                    return { success: true };
                }
                await log(`Asset signature verification failed. ${assetId}`);
                throw new HttpError('Asset signature verification failed', 404);
            }
            await log(`No marketplace key`);
            throw new HttpError('No marketplace key', 404);
        } else {
            await log(`No encrypted payload found`);
            throw new HttpError('No encrypted payload found', 404);
        }
    } catch (error) {
        await log(`Asset registration failed. ${error.toString()}`);
        throw new Error(error);
    }
}
