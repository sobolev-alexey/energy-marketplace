import { writeData } from './databaseHelper';
import { signPublishEncryptSendMarketplace } from './routineHelper';

export const log = async (event: string) => {
    try {
        await writeData('log', { timestamp: Date.now().toString(), event });
        const timestamp = (new Date()).toLocaleString().replace(/\//g, '.');
        console.log('Log:', timestamp, event);
    } catch (error) {
        console.error('logger', error);
    }
};

export const transactionLog = async (params: object) => {
    try {
        await writeData('transaction', params);
        const timestamp = (new Date()).toLocaleString().replace(/\//g, '.');
        console.log('Transaction log:', timestamp, params);

        // Notify asset owner about new transaction event
        await signPublishEncryptSendMarketplace(params);
    } catch (error) {
        console.error('logger', error);
    }
};
