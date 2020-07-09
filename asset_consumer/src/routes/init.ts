import { deviceUUID, serverPortNumber, websocketURL, websocketPortNumber } from '../config.json';
import { readData, readAllData, writeData } from '../utils/databaseHelper';
import { EncryptionService, IMessagePayload } from '../utils/encryptionHelper';
import { log } from '../utils/loggerHelper';
import { sendRequest } from '../utils/communicationHelper';

export async function init(_: any, request: any): Promise<any> {
    try {
        console.log('Check 01', request?.uuid, deviceUUID);
        if (request && request?.uuid === deviceUUID) {
            await readAllData('asset');
            await new Promise(resolve => setTimeout(resolve, 2000));
            await log('Initializing...');
            console.log('Check 02', request);

            const { assetWallet, ...config } = request;
            await writeData('asset', { ...config, marketplacePublicKey: decodeURIComponent(request.marketplacePublicKey) });
            await writeData('wallet', assetWallet);

            console.log('Check 03');

            let keys: any = await readData('keys');
            if (!keys || !keys.privateKey) {
                const encryptionService = new EncryptionService();
                keys = encryptionService.generateKeys();
                await writeData('keys', keys);
            }
            console.log('Check 04', config.marketplaceAPI);

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

                console.log('Check 05', assetPayload);

                // Sign payload
                const encryptionService = new EncryptionService();
                const signature: Buffer = encryptionService.signMessage(
                    keys?.privateKey, assetPayload
                );

                console.log('Check 06');

                // Encrypt payload and signature with Marketplace public key
                const messagePayload: IMessagePayload = { message: assetPayload, signature };

                console.log('Check 07', messagePayload);

                const encrypted: string = encryptionService.publicEncrypt(
                    decodeURIComponent(request.marketplacePublicKey), JSON.stringify(messagePayload)
                );

                console.log('Check 08');

                const response = await sendRequest('/register', { encrypted });

                console.log('Check 09', response);

                if (!response || !response.success) {
                    console.log('Check 666');
                    throw new Error('Asset registration with marketplace failed');
                }
                console.log('Check 10');
            }
            console.log('Check 11');

            await log('Initialization Succeeded');
            return { success: true, publicKey: keys.publicKey };
        }
        console.log('Check 12');
        return { success: false, error: 'Wrong UUID' };
    } catch (err) {
        console.log('Check 13', err);
        await log(`Initialization Failed ${err.toString()}`);
        return { success: false, error: 'Asset registration with marketplace failed' };
    }
}
