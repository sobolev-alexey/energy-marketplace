import { decryptVerify, signPublishEncryptSend } from '../utils/routineHelper';
import { log, transactionLog } from '../utils/loggerHelper';

export default async (job, done) => {
    try {
        await log(`issueClaim job started`);
        const request = await decryptVerify(job?.data);
        const claimPayload = request?.message;

        console.log('processClaimRequest', request);
        if (request?.verificationResult && claimPayload) {
            // Log transaction
            await transactionLog(claimPayload);

            const claimResponse = await signPublishEncryptSend(
                claimPayload, claimPayload?.requesterId, claimPayload?.requesterTransactionId, 'claim'
            );

            // Evaluate responses 
            if (claimResponse?.success) {
                await log(`Claim request successful. ${claimPayload?.contractId}`);
            } else {
                await log(`Claim request failure. Request: ${JSON.stringify(claimPayload)}, Response: ${JSON.stringify(claimResponse)}, Contract: ${claimPayload?.contractId}`);
            }
            done(null);
        } else {
            await log('Asset signature verification failed');
            done(new Error('Asset signature verification failed'));
        }
    } catch (error) {
        console.error('issueClaim', error);
        await log(`issueClaim Error ${error.toString()}`);
        done(new Error(`issueClaim Error ${error.toString()}`));
    }
};
