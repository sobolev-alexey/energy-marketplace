import { readData } from './databaseHelper';
import { log } from './loggerHelper';
import { publish } from './mamHelper';
import { EncryptionService, IMessagePayload } from './encryptionHelper';
import { sendRequest } from './communicationHelper';

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
            const mam = await publish(transactionId, { message: payload, signature });
            console.log(333, mam);

            // Encrypt payload and signature with asset's public key
            const messagePayload: IMessagePayload = { message: payload, signature, mam };
            console.log(444, messagePayload);

            const encrypted: string = encryptionService.publicEncrypt(
                asset?.assetPublicKey, JSON.stringify(messagePayload)
            );

            // Send encrypted payload and signature to asset
            const response = await sendRequest(`${asset?.assetURL}/${endpoint}`, { encrypted });
            console.log(555, response);
            return response;
        }
    } catch (error) {
        console.error('signPublishEncryptSend', error);
        await log(`signPublishEncryptSend Error ${error.toString()}`);
        return null;
    }
}
