import { writeData } from './databaseHelper';
import { signPublishEncryptSendMarketplace } from './routineHelper';

export const log = async (event: string) => {
    try {
        await writeData('log', { timestamp: Date.now().toString(), event });
    } catch (error) {
        console.error('logger', error);
    }
};

export const transactionLog = async (params: object) => {
    try {
        await writeData('transaction', params);
        console.log('Transaction log:', params);

        // Notify asset owner about new transaction event
        await signPublishEncryptSendMarketplace(params);
    } catch (error) {
        console.error('logger', error);
    }
};
