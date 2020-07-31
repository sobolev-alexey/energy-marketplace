import { decryptVerify, signPublishEncryptSend } from '../utils/routineHelper';
import { log, transactionLog } from '../utils/loggerHelper';

export default async (job, done) => {
    try {
        await log(`provision job started`);
        const request = await decryptVerify(job?.data);
        const paymentRequestPayload = request?.message;

        paymentRequestPayload.timestamp = Date.now().toString();
        paymentRequestPayload.status = 'Payment requested';

        if (request?.verificationResult && paymentRequestPayload) {
            // Log transaction
            await transactionLog(paymentRequestPayload);

            const paymentResponse = await signPublishEncryptSend(
                paymentRequestPayload, paymentRequestPayload?.requesterId, paymentRequestPayload?.requesterTransactionId, 'payment'
            );

            // Evaluate responses 
            if (paymentResponse?.success) {
                await log(`Provision confirmation processing successful. ${request?.message?.contractId}`);
            } else {
                await log(`Payment request communication failure. Request: ${JSON.stringify(paymentRequestPayload)}, Response: ${JSON.stringify(paymentResponse)}, Contract: ${paymentRequestPayload.contractId}`);
            }
            done(null);
        } else {
            await log('Asset signature verification failed');
            done(new Error('Asset signature verification failed'));
        }
    } catch (error) {
        console.error('provision', error);
        await log(`provision Error ${error.toString()}`);
        done(new Error(`provision Error ${error.toString()}`));
    }
};
