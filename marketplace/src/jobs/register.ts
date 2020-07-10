import { log } from '../utils/loggerHelper';
import { readData, writeData } from '../utils/databaseHelper';
import { EncryptionService, IReceivedMessagePayload } from '../utils/encryptionHelper';

export default async (job, done) => {
    try {
        await log(`register job started`);
        if (job?.data?.encrypted) {
            const keys: any = await readData('keys');
            if (keys && keys.privateKey) {
                const encryptionService = new EncryptionService();

                const decrypted: IReceivedMessagePayload = encryptionService.privateDecrypt(
                    keys.privateKey, job?.data?.encrypted
                );
    
                const verificationResult: boolean = encryptionService.verifySignature(
                    decrypted?.message?.assetPublicKey, decrypted?.message, decrypted?.signature
                );  
                    
                const assetId = decrypted?.message?.assetId;
                if (verificationResult) {
                    const asset: any = await readData('asset', 'assetId', assetId);

                    if (asset) {
                        await log(`Asset already exists. ${assetId}`);
                        done(null);
                    }

                    console.log('Register asset', decrypted?.message);

                    await writeData('asset', decrypted?.message);
                    await log(`Asset registration successful. ${assetId}`);
                    done(null);
                }
                await log(`Asset signature verification failed. ${assetId}`);
                done(new Error('Asset signature verification failed'));
            } else {
                await log(`No marketplace key`);
                done(new Error('No marketplace key'));
            }
        } else {
            await log(`No encrypted payload found`);
            done(new Error('No encrypted payload found'));
        }
    } catch (error) {
        console.error('register', error);
        await log(`register Error ${error.toString()}`);
        done(new Error(`register Error ${error.toString()}`));
    }
};
