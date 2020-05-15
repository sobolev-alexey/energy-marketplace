import randomstring from 'randomstring';
import { log, transactionLog } from './loggerHelper';
import { decryptVerify, signPublishEncryptSend } from './routineHelper';
import { readData } from '../utils/databaseHelper';

export async function processMatch(requestPayload: any): Promise<{success: boolean}> {
    try {
        if (requestPayload?.request && requestPayload?.offer) {
            // Assign contract ID
            const contractId = randomstring.generate(20);
            const timestamp = Date.now().toString();
            const consumerAsset: any = await readData('asset', 'assetId', requestPayload?.request?.requesterId);

            // console.log('MATCH 1', requestPayload);

            const transaction = {
                contractId, 
                timestamp,
                providerTransactionId: requestPayload?.offer?.providerTransactionId,
                requesterTransactionId: requestPayload?.request?.requesterTransactionId,
                providerId: requestPayload?.offer?.providerId,
                energyAmount: requestPayload?.request?.energyAmount, 
                energyPrice: requestPayload?.offer?.energyPrice, 
                requesterId: requestPayload?.request?.requesterId,
                walletAddress: requestPayload?.offer?.walletAddress,
                status: 'Contract created', 
                location: consumerAsset?.location,
                additionalDetails: ''
            };

            const offer = { ...transaction, type: 'offer' };
            const request = { ...transaction, type: 'request' };

            const payload = { offer, request, contractId };
            await log(`Match found. Request: ${JSON.stringify(request)}, Offer: ${JSON.stringify(offer)}, Contract: ${contractId}`);
            
            // console.log('MATCH 2', payload);

            // Send out contract confirmations
            const producerResponse = await signPublishEncryptSend(
                payload, offer?.providerId, offer?.providerTransactionId, 'contract'
            );
            // console.log('MATCH 3', producerResponse);
            
            const consumerResponse = await signPublishEncryptSend(
                payload, request?.requesterId, request?.requesterTransactionId, 'contract'
            );
            // console.log('MATCH 4', consumerResponse);

            // Evaluate responses 
            if (producerResponse?.success && consumerResponse?.success) {
                // Update transaction log for producer
                await transactionLog(offer);

                // Update transaction log for consumer
                await transactionLog(request);

                await log(`Contract details sent to assets and stored. Contract: ${contractId}`);

                // console.log('MATCH 5 DONE');
            } else {
                await log(`Contract communication failure. Request: ${JSON.stringify(consumerResponse)}, Offer: ${JSON.stringify(producerResponse)}, Contract: ${contractId}`);
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

export async function processProvisionConfirmation(requestDetails: any): Promise<any> {
    try {
        const request = await decryptVerify(requestDetails);
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
            return { success: true };
        }
        throw new Error('Asset signature verification failed');
    } catch (error) {
        await log(`Provision confirmation failed. ${error.toString()}`);
        throw new Error(error);
    }
}
