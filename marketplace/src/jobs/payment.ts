import { decryptVerify, signPublishEncryptSend } from '../utils/routineHelper';
import { log, transactionLog } from '../utils/loggerHelper';

export default async (job, done) => {
    try {
        await log(`payment processing job started`);
        const request = await decryptVerify(job?.data);
        const paymentConfirmationPayload = request?.message;

        console.log('processPaymentProcessingConfirmation', request);
        if (request?.verificationResult && paymentConfirmationPayload) {
            // Log transaction
            await transactionLog(paymentConfirmationPayload);

            paymentConfirmationPayload.type = 'offer';
            const paymentConfirmationResponse = await signPublishEncryptSend(
                paymentConfirmationPayload, paymentConfirmationPayload?.providerId, paymentConfirmationPayload?.providerTransactionId, 'payment_sent'
            );

            // Evaluate responses 
            if (paymentConfirmationResponse?.success) {
                await log(`Payment processing confirmation successful. ${request?.message?.contractId}`);
            } else {
                await log(`Payment processing confirmation request failure. Request: ${JSON.stringify(paymentConfirmationPayload)}, Response: ${JSON.stringify(paymentConfirmationResponse)}, Contract: ${paymentConfirmationPayload.contractId}`);
            }
            done(null);
        } else {
            await log('Asset signature verification failed');
            done(new Error('Asset signature verification failed'));
        }
    } catch (error) {
        console.error('payment processing', error);
        await log(`payment processing Error ${error.toString()}`);
        done(new Error(`payment processing Error ${error.toString()}`));
    }
};
