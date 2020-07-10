import randomstring from 'randomstring';
import { signPublishEncryptSend } from '../utils/routineHelper';
import { log, transactionLog } from '../utils/loggerHelper';
import { readData } from '../utils/databaseHelper';

export default async (job, done) => {
    try {
        await log(`processMatch job started`);
        if (job?.data?.request && job?.data?.offer) {
            // Assign contract ID
            const contractId = randomstring.generate(20);
            const timestamp = Date.now().toString();
            const requesterAsset: any = await readData('asset', 'assetId', job?.data?.request?.requesterId);

            const transaction = {
                contractId, 
                timestamp,
                providerTransactionId: job?.data?.offer?.providerTransactionId,
                requesterTransactionId: job?.data?.request?.requesterTransactionId,
                providerId: job?.data?.offer?.providerId,
                energyAmount: job?.data?.request?.energyAmount, 
                energyPrice: job?.data?.offer?.energyPrice, 
                requesterId: job?.data?.request?.requesterId,
                walletAddress: job?.data?.offer?.walletAddress,
                status: 'Contract created', 
                location: requesterAsset?.location,
                additionalDetails: ''
            };

            const offer = { ...transaction, type: 'offer' };
            const request = { ...transaction, type: 'request' };

            const payload = { offer, request, contractId };
            await log(`Match found. Request: ${JSON.stringify(request)}, Offer: ${JSON.stringify(offer)}, Contract: ${contractId}`);
            
            // Send out contract confirmations
            const providerResponse = await signPublishEncryptSend(
                payload, offer?.providerId, offer?.providerTransactionId, 'contract'
            );
            
            const requesterResponse = await signPublishEncryptSend(
                payload, request?.requesterId, request?.requesterTransactionId, 'contract'
            );

            // Evaluate responses 
            if (providerResponse?.success && requesterResponse?.success) {
                // Update transaction log for provider
                await transactionLog(offer);

                // Update transaction log for requester
                await transactionLog(request);

                await log(`Contract details sent to assets and stored. Contract: ${contractId}`);
            } else {
                await log(`Contract communication failure. Request: ${JSON.stringify(requesterResponse)}, Offer: ${JSON.stringify(providerResponse)}, Contract: ${contractId}`);
            }
            done(null);
        } else {
            await log('No offer or request found in match');
            done(new Error('No offer or request found in match'));
        }
    } catch (error) {
        console.error('processMatch', error);
        await log(`processMatch Error ${error.toString()}`);
        done(new Error(`processMatch Error ${error.toString()}`));
    }
};
