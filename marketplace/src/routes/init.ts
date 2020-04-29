// import path from 'path';
import marketplaceKeys from '../marketplace.config.json';
import { readAllData, writeData } from '../utils/databaseHelper';
import { log } from '../utils/loggerHelper';

/**
 * Initialise the database.
 * @param config The configuration.
 */
export async function init(): Promise<void> {
    try {
        // Register asset with Marketplace
        // asset ID, type, MAM channel details, public key in a local database
        // replies with MAM root/DID, where public key is stored

        const keys: any = await readAllData('keys');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await log('Initializing...');
        if (!keys || !keys.privateKey) {
            await writeData('keys', marketplaceKeys);
        }
    } catch (err) {
        await log(`Initialization Failed ${err.toString()}`);
        return;
    }

    await log('Initialization Succeeded');
}
