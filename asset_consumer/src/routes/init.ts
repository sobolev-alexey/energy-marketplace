import { deviceUUID, serverPortNumber, websocketURL, websocketPortNumber } from '../config.json';
import { readData, readAllData, writeData } from '../utils/databaseHelper';
import { EncryptionService, IMessagePayload } from '../utils/encryptionHelper';
import { log } from '../utils/loggerHelper';
import { sendRequest } from '../utils/communicationHelper';

export async function init(_: any, request: any): Promise<any> {
    try {
        if (!request?.uuid || request.uuid !== deviceUUID) {
            return { success: false, error: 'Wrong UUID' };
        }

        await readAllData('asset');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await log('Initializing...');

        const { assetWallet, ...config } = request;
        await writeData('asset', { ...config, marketplacePublicKey: decodeURIComponent(request.marketplacePublicKey) });
        await writeData('wallet', assetWallet);

        let keys: any = await readData('keys');
        if (!keys || !keys.privateKey) {
            const encryptionService = new EncryptionService();
            keys = encryptionService.generateKeys();
            await writeData('keys', keys);
        }

        // Register asset with Marketplace
        if (config.marketplaceAPI) {
            // Create payload, specify price and amount
            const assetPayload = {
                assetId: config.assetId, 
                assetOwner: config.assetOwner, 
                assetName: config.assetName, 
                assetPublicKey: keys.publicKey, 
                location: config.location,
                type: config.type, 
                network: config.network,
                websocket: `${websocketURL}:${websocketPortNumber}`,
                assetURL: `${websocketURL}:${serverPortNumber}`
            };

            // Sign payload
            const encryptionService = new EncryptionService();
            const signature: Buffer = encryptionService.signMessage(
                keys?.privateKey, assetPayload
            );

            // Encrypt payload and signature with Marketplace public key
            const messagePayload: IMessagePayload = { message: assetPayload, signature };

            const encrypted: string = encryptionService.publicEncrypt(
                decodeURIComponent(request.marketplacePublicKey), JSON.stringify(messagePayload)
            );

            const response = await sendRequest('/register', { encrypted });
            if (!response || !response.success) {
                throw new Error('Asset registration with marketplace failed');
            }
        }
        await log('Initialization Succeeded');

        return { success: true, publicKey: keys.publicKey };
    } catch (err) {
        await log(`Initialization Failed ${err.toString()}`);
        return;
    }
}
