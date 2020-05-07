import randomstring from 'randomstring';
import { log, transactionLog } from './loggerHelper';
import { signPublishEncryptSend } from './routineHelper';
import { readData } from '../utils/databaseHelper';

export async function processMatch(requestPayload: any): Promise<{success: boolean}> {
    try {
        if (requestPayload?.request && requestPayload?.offer) {
            // Assign contract ID
            const contractId = randomstring.generate(20);
            const timestamp = Date.now().toString();
            const consumerAsset: any = await readData('asset', 'assetId', requestPayload?.request?.assetId);

            const transaction = {
                contractId, 
                timestamp,
                providerId: requestPayload?.offer?.assetId,
                energyAmount: requestPayload?.request?.energyAmount, 
                energyPrice: requestPayload?.offer?.energyPrice, 
                requesterId: requestPayload?.request?.assetId,
                status: 'Contract created', 
                location: consumerAsset?.location,
                additionalDetails: ''
            };

            const offer = {
                ...transaction,
                type: 'offer',
                transactionId: requestPayload?.offer?.transactionId
            };

            const request = {
                ...transaction,
                type: 'request',
                transactionId: requestPayload?.request?.transactionId
            };

            const payload = { offer, request, contractId };
            await log(`Match found. Request: ${request}, Offer: ${offer}, Contract: ${contractId}`);
            
            console.log('MATCH 1', payload);

            // Send out contract confirmations
            const producerResponse = await signPublishEncryptSend(
                payload, requestPayload?.offer?.assetId, requestPayload?.offer?.transactionId, 'contract'
            );
            console.log('MATCH 2', producerResponse);
            
            const consumerResponse = await signPublishEncryptSend(
                payload, requestPayload?.request?.assetId, requestPayload?.request?.transactionId, 'contract'
            );
            console.log('MATCH 3', consumerResponse);

            // Evaluate responses 
            if (producerResponse?.success && consumerResponse?.success) {
                // Update transaction log for producer
                await transactionLog(offer);

                // Update transaction log for consumer
                await transactionLog(request);

                await log(`Contract details sent to assets and stored. Contract: ${contractId}`);

                console.log('MATCH 4 DONE');
            } else {
                await log(`Contract communication failure. Request: ${consumerResponse}, Offer: ${producerResponse}, Contract: ${contractId}`);
            }
            return { success: true };
        } else {
            await log(`No offer or request found in match`);
            throw new Error('No offer or request found in match');
        }
    } catch (error) {
        await log(`Match processing failed. ${error.toString()}`);
        throw new Error(error);
    }
}
