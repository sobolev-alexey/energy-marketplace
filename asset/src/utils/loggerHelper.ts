import { writeData } from './databaseHelper';
import { signPublishEncryptSend } from './routineHelper';

export const log = async (event: string) => {
    try {
        await writeData('log', { timestamp: Date.now().toString(), event });
        const timestamp = (new Date()).toLocaleString().replace(/\//g, '.');
        console.log('log', timestamp, event);
    } catch (error) {
        console.error('logger', error);
    }
};

export const transactionLog = async (payload: object) => {
    try {
        await writeData('transaction', payload);
        const timestamp = (new Date()).toLocaleString().replace(/\//g, '.');
        console.log('transactionLog', timestamp, payload);

        // Notify asset owner about new transaction event
        await signPublishEncryptSend(payload, 'notify_event');
    } catch (error) {
        console.error('logger', error);
    }
};
