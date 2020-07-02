import { signPublishEncryptSend } from '../utils/routineHelper';
import { log, transactionLog } from '../utils/loggerHelper';
import { queues, options } from '../utils/queueHelper';
import { unreserveEnergy } from '../utils/energyProvisionHelper';

export default async (job, done) => {
    try {
        await log(`issueClaim job started`);
        let reminderNumber = 1;
        if (job?.data?.additionalDetails.startsWith('Payment reminder #')) {
            reminderNumber = Number(job?.data?.additionalDetails.replace('Payment reminder #', ''));
        }
        if (reminderNumber && reminderNumber <= 3) {
            // Add note into additional details
            const payload = {
                ...job?.data,
                timestamp: Date.now().toString(), 
                additionalDetails: `Payment reminder #${reminderNumber}`
            };

            // Log transaction
            await transactionLog(payload);

            // Re-send energy provision confirmation
            queues.energyProvision.add(payload, options);
        } else {
            // Add note into additional details
            const payload = {
                ...job?.data,
                timestamp: Date.now().toString(), 
                status: 'Claim issued',
                additionalDetails: `Claim issued after ${reminderNumber} payment reminders`
            };

            // Log transaction
            await transactionLog(payload);

            await unreserveEnergy(payload);

            // Issue claim
            const response = await signPublishEncryptSend(payload, 'claim');

            // Evaluate response
            if (response?.success) {
                await log(`Claim request sent to marketplace and stored. Contract: ${payload.contractId}`);
            } else {
                await log(`Claim request failure. Request: ${payload}`);
            }
        }

        done(null);
    } catch (error) {
        console.error('issueClaim', error);
        await log(`issueClaim Error ${error.toString()}`);
        done(new Error(`issueClaim Error ${error.toString()}`));
    }
};
