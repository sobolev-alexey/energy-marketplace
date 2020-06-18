import { signPublishEncryptSend } from '../utils/routineHelper';
import { log, transactionLog } from '../utils/loggerHelper';

export default async (job, done) => {
    try {
        await log(`confirmPayment job started`);
        const payload = {
            ...job?.data,
            timestamp: Date.now().toString(), 
            status: 'Payment confirmed'
        };
        await transactionLog(payload);

        const response = await signPublishEncryptSend(payload, 'payment_confirmation');

        // Evaluate response
        if (response?.success) {
            await log(`Payment confirmation sent to marketplace and stored. Contract: ${payload.contractId}`);
        } else {
            await log(`Payment confirmation failure. Request: ${payload}`);
        }
        done(null);
    } catch (error) {
        console.error('confirmPayment', error);
        await log(`confirmPayment Error ${error.toString()}`);
        done(new Error(`confirmPayment Error ${error.toString()}`));
    }
};
