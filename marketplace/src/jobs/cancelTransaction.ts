import { decryptVerify, signPublishEncryptSend } from '../utils/routineHelper';
import { log, transactionLog } from '../utils/loggerHelper';
import { sendRequest } from '../utils/communicationHelper';
import { bidManagerURL } from '../config.json';

export default async (job, done) => {
    try {
        await log(`cancelTransaction job started`);
        const request = await decryptVerify(job?.data);
        const cancellationPayload = request?.message;

        if (request?.verificationResult && cancellationPayload) {
            // Log transaction
            await transactionLog(cancellationPayload);

            if (cancellationPayload?.contractId) {
                let cancellationResponse;

                if (cancellationPayload?.type === 'offer') {
                    // Cancel for requester
                    cancellationResponse = await signPublishEncryptSend(
                        cancellationPayload, cancellationPayload?.requesterId, cancellationPayload?.requesterTransactionId, 'cancel'
                    );
                } else if (cancellationPayload?.type === 'request') {
                    // Cancel for provider
                    cancellationResponse = await signPublishEncryptSend(
                        cancellationPayload, cancellationPayload?.providerId, cancellationPayload?.providerTransactionId, 'cancel'
                    );
                }

                // Evaluate response
                if (cancellationResponse?.success) {
                    await log(`Transaction cancellation successful. ${request?.message?.contractId}`);
                } else {
                    await log(`Transaction cancellation request failure. Request: ${JSON.stringify(cancellationPayload)}, Response: ${JSON.stringify(cancellationResponse)}`);
                }
            } else {
                // Cancel with Bid manager
                const bidManagerEndpoint = `${bidManagerURL}/remove`;   
                await sendRequest(bidManagerEndpoint, cancellationPayload);
            }
            done(null);
        } else {
            await log('Asset signature verification failed');
            done(new Error('Asset signature verification failed'));
        }
    } catch (error) {
        console.error('cancelTransaction', error);
        await log(`cancelTransaction Error ${error.toString()}`);
        done(new Error(`cancelTransaction Error ${error.toString()}`));
    }
};
