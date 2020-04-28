// import path from 'path';
import assetConfig from '../asset.config.json';
import { readData, readAllData, writeData } from '../utils/databaseHelper';
import { EncryptionService, IKeys } from '../utils/encryptionHelper';
import { log } from '../utils/loggerHelper';

/**
 * Initialise the database.
 * @param config The configuration.
 */
export async function init(): Promise<void> {
    try {
        // Verify the config is received from user
        // Use trusted DID to verify
        
        // Register asset with Marketplace
        // asset ID, type, MAM channel details, public key in a local database
        // replies with MAM root/DID, where public key is stored

        await readAllData('asset');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await log('Initializing...');
        const { assetWallet, ...config } = assetConfig;
        await writeData('wallet', assetWallet);
        await writeData('asset', config);

        const keys: any = await readData('keys');
        if (!keys || !keys.privateKey) {
            const encryptionService = new EncryptionService();
            const keyPair: IKeys = encryptionService.generateKeys();
            await writeData('keys', keyPair);
        }
    } catch (err) {
        await log(`Initialization Failed ${err.toString()}`);
        return;
    }

    await log('Initialization Succeeded');
}
