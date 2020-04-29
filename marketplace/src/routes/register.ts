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
    
                const asset: any = await readData('asset', 'assetId', decrypted?.message?.assetId);
                if (verificationResult && !asset) {
                    await writeData('asset', decrypted?.message);
                }
                return { success: true };
            }
            throw new HttpError('No marketplace key', 404);
        } else {
            throw new HttpError('No data found', 404);
        }
    } catch (error) {
        await log(`Registration failed. Error: ${error.toString()}`);
        throw new Error(error);
    }
}
