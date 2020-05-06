import randomstring from 'randomstring';
import { log, transactionLog } from '../utils/loggerHelper';
import { HttpError } from '../errors/httpError';
import { signPublishEncryptSend } from '../utils/businessLogicHelper';

// Endpoint called by bid manager when a match between offer and request is found
export async function match(_: any, requestPayload: any): Promise<any> {
    try {
        if (requestPayload?.request && requestPayload?.offer) {
            // Assign contract ID
            const contractId = randomstring.generate(20);
            const timestamp = Date.now().toString();
            const offer = {
                contractId, 
                timestamp,
                transactionId: requestPayload?.offer?.transactionId,
                providerId: requestPayload?.offer?.assetId,
                energyAmount: requestPayload?.request?.energyAmount, 
                paymentAmount: requestPayload?.offer?.energyPrice, 
                requesterId: requestPayload?.request?.assetId,
                status: 'Contract created', 
                additionalDetails: ''
            };

            const request = {
                contractId, 
                timestamp,
                transactionId: requestPayload?.request?.transactionId,
                providerId: requestPayload?.offer?.assetId,
                energyAmount: requestPayload?.request?.energyAmount, 
                paymentAmount: requestPayload?.offer?.energyPrice, 
                requesterId: requestPayload?.request?.assetId,
                status: 'Contract created', 
                additionalDetails: ''
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
            throw new HttpError('No offer or request found in match', 404);
        }
    } catch (error) {
        await log(`Match processing failed. ${error.toString()}`);
        throw new Error(error);
    }
}
