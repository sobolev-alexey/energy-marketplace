import { decryptVerify, signPublishEncryptSend } from '../utils/routineHelper';
import { log, transactionLog } from '../utils/loggerHelper';

export default async (job, done) => {
    try {
        await log(`paymentConfirmation job started`);
        const request = await decryptVerify(job?.data);
        const paymentConfirmationPayload = request?.message;

        console.log('processPaymentConfirmation', request);
        if (request?.verificationResult && paymentConfirmationPayload) {
            // Log transaction
            await transactionLog(paymentConfirmationPayload);

            const paymentConfirmationResponse = await signPublishEncryptSend(
                paymentConfirmationPayload, paymentConfirmationPayload?.requesterId, paymentConfirmationPayload?.requesterTransactionId, 'payment_confirmed'
            );

            // Evaluate responses 
            if (paymentConfirmationResponse?.success) {
                await log(`Payment confirmation successful. ${paymentConfirmationPayload?.contractId}`);
            } else {
                await log(`Payment confirmation request failure. Request: ${JSON.stringify(paymentConfirmationPayload)}, Response: ${JSON.stringify(paymentConfirmationResponse)}, Contract: ${paymentConfirmationPayload?.contractId}`);
            }
            done(null);
        } else {
            await log('Asset signature verification failed');
            done(new Error('Asset signature verification failed'));
        }
    } catch (error) {
        console.error('paymentConfirmation', error);
        await log(`paymentConfirmation Error ${error.toString()}`);
        done(new Error(`paymentConfirmation Error ${error.toString()}`));
    }
};
