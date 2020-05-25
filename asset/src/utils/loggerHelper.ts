import { writeData } from './databaseHelper';
// import { signPublishEncryptSend } from './routineHelper';

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

        // Notify asset owner about new transaction event
        // await signPublishEncryptSend(payload, 'notify');
    } catch (error) {
        console.error('logger', error);
    }
};
