import { writeData } from './databaseHelper';

export const log = async (event: string) => {
    try {
        await writeData('log', { timestamp: Date.now().toString(), event });
        console.log('Log:', event);
    } catch (error) {
        console.error('logger', error);
    }
};

export const transactionLog = async (params: object) => {
    try {
        await writeData('transaction', params);
        console.log('Transaction log:', params);
    } catch (error) {
        console.error('logger', error);
    }
};
