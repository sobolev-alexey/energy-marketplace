// import path from 'path';
import assetConfig from '../asset.config.json';
import { readData, readAllData, writeData } from '../utils/databaseHelper';
import { EncryptionService } from '../utils/encryptionHelper';
import { log } from '../utils/loggerHelper';
import { sendRequest } from '../utils/communicationHelper';

/**
 * Initialise the database.
 * @param config The configuration.
 */
export async function init(): Promise<void> {
    try {
        // Verify the config is received from user
        // Use trusted DID to verify
        
        await readAllData('asset');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await log('Initializing...');
        const { assetWallet, ...config } = assetConfig;
        await writeData('wallet', assetWallet);
        await writeData('asset', config);

        let keys: any = await readData('keys');
        if (!keys || !keys.privateKey) {
            const encryptionService = new EncryptionService();
            keys = encryptionService.generateKeys();
            await writeData('keys', keys);
        }

        // Register asset with Marketplace
        if (config.marketplaceAPI) {
            const assetPayload = {
                assetId: config.assetId, 
                assetOwner: config.assetOwner, 
                assetName: config.assetName, 
                assetPublicKey: keys.publicKey, 
                deviceUUID: config.deviceUUID, 
                location: config.location,
                type: config.type, 
                network: config.network
            };
            const response = await sendRequest('/register', assetPayload);
            if (!response || !response.success) {
                throw new Error('Asset registration with marketplace failed');
            }
        }
    } catch (err) {
        await log(`Initialization Failed ${err.toString()}`);
        return;
    }

    await log('Initialization Succeeded');
}
