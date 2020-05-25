import { writeData } from './databaseHelper';

export const log = async (event: string) => {
    try {
        await writeData('log', { timestamp: Date.now().toString(), event });
        // console.log('Log:', event);
    } catch (error) {
        console.error('logger', error);
    }
};

export const transactionLog = async (payload: object) => {
    try {
        await writeData('transaction', payload);
        // console.log('Transaction log:', payload);
    } catch (error) {
        console.error('logger', error);
    }
};
