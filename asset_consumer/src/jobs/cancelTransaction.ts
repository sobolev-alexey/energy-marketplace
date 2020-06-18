import { signPublishEncryptSend } from '../utils/routineHelper';
import { log, transactionLog } from '../utils/loggerHelper';
import { unreserveEnergy } from '../utils/energyProvisionHelper';

export default async (job, done) => {
    try {
        await log(`cancelTransaction job started`);
        // Cancel own transaction
        const timestamp = Date.now().toString();
        const payload = {
            ...job?.data,
            timestamp, 
            status: 'Cancelled'
        };
        await transactionLog(payload);
        await unreserveEnergy(payload);

        // Send to Marketplace
        const response = await signPublishEncryptSend(payload, 'cancel');

        // Evaluate response
        if (response?.success) {
            await log(`Cancellation request sent to marketplace and stored. TransactionId: ${payload?.requesterTransactionId || payload?.providerTransactionId}`);
        } else {
            await log(`Cancellation request failure. Request: ${payload}`);
        }

        done(null);
    } catch (error) {
        console.error('cancelTransaction', error);
        await log(`cancelTransaction Error ${error.toString()}`);
        done(new Error(`cancelTransaction Error ${error.toString()}`));
    }
};
