import { signPublishEncryptSend } from '../utils/routineHelper';
import { log, transactionLog } from '../utils/loggerHelper';

export default async (job, done) => {
    try {
        await log(`confirmProcessing job started`);
        const transaction = JSON.parse(job?.data);
        const payload = {
            ...transaction,
            timestamp: Date.now().toString(), 
            status: 'Payment processed'
        };
        await transactionLog(payload);

        const response = await signPublishEncryptSend(payload, 'payment_processing');

        // Evaluate response
        if (response?.success) {
            await log(`Payment processing confirmation sent to marketplace and stored. Contract: ${payload.contractId}`);
        } else {
            await log(`Payment processing confirmation failure. Request: ${payload}`);
        }
        done(null);
    } catch (error) {
        console.error('confirmProcessing', error);
        await log(`confirmProcessing Error ${error.toString()}`);
        done(new Error(`confirmProcessing Error ${error.toString()}`));
    }
};
