// import path from 'path';
import assetConfig from '../asset.config.json';
import { readAllData, writeData } from '../utils/databaseHelper';

/**
 * Initialise the database.
 * @param config The configuration.
 * @returns The response.
 */
export async function init(): Promise<string[]> {
    let log = 'Initializing\n';

    try {
        await readAllData('asset');
        await new Promise(resolve => setTimeout(resolve, 2000));
        const { assetWallet, ...config } = assetConfig;
        await writeData('wallet', assetWallet);
        await writeData('asset', config);
    } catch (err) {
        log += `Failed\n${err.toString()}\n`;
    }

    if (log.indexOf('Failed') < 0) {
        log += 'Initialization Succeeded';
    } else {
        log += 'Initialization Failed';
    }

    return log.split('\n');
}
