import randomstring from 'randomstring';
import { log, transactionLog } from './loggerHelper';
import { decryptVerify, signPublishEncryptSend } from './routineHelper';
import { readData } from './databaseHelper';
import { sendRequest } from './communicationHelper';
import { bidManagerURL } from '../config.json';

export async function processMatch(requestPayload: any): Promise<{success: boolean}> {
    try {
        if (requestPayload?.request && requestPayload?.offer) {
            // Assign contract ID
            const contractId = randomstring.generate(20);
            const timestamp = Date.now().toString();
            const consumerAsset: any = await readData('asset', 'assetId', requestPayload?.request?.requesterId);

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
            
            // Send out contract confirmations
            const producerResponse = await signPublishEncryptSend(
                payload, offer?.providerId, offer?.providerTransactionId, 'contract'
            );
            
            const consumerResponse = await signPublishEncryptSend(
                payload, request?.requesterId, request?.requesterTransactionId, 'contract'
            );

            // Evaluate responses 
            if (producerResponse?.success && consumerResponse?.success) {
                // Update transaction log for producer
                await transactionLog(offer);

                // Update transaction log for consumer
                await transactionLog(request);

                await log(`Contract details sent to assets and stored. Contract: ${contractId}`);
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

export async function processPaymentProcessingConfirmation(requestDetails: any): Promise<any> {
    try {
        const request = await decryptVerify(requestDetails);
        const paymentConfirmationPayload = request?.message;

        console.log('processPaymentProcessingConfirmation', request);
        if (request?.verificationResult && paymentConfirmationPayload) {
            // Log transaction
            await transactionLog(paymentConfirmationPayload);

            const paymentConfirmationResponse = await signPublishEncryptSend(
                paymentConfirmationPayload, paymentConfirmationPayload?.providerId, paymentConfirmationPayload?.requesterTransactionId, 'payment_sent'
            );

            // Evaluate responses 
            if (paymentConfirmationResponse?.success) {
                await log(`Payment processing confirmation successful. ${request?.message?.contractId}`);
            } else {
                await log(`Payment processing confirmation request failure. Request: ${JSON.stringify(paymentConfirmationPayload)}, Response: ${JSON.stringify(paymentConfirmationResponse)}, Contract: ${paymentConfirmationPayload.contractId}`);
            }
            return { success: true };
        }
        throw new Error('Asset signature verification failed');
    } catch (error) {
        await log(`Payment processing confirmation failed. ${error.toString()}`);
        throw new Error(error);
    }
}

export async function processPaymentConfirmation(requestDetails: any): Promise<any> {
    try {
        const request = await decryptVerify(requestDetails);
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
            return { success: true };
        }
        throw new Error('Asset signature verification failed');
    } catch (error) {
        await log(`Payment confirmation failed. ${error.toString()}`);
        throw new Error(error);
    }
}

export async function processCancellationRequest(requestDetails: any): Promise<any> {
    try {
        const request = await decryptVerify(requestDetails);
        const cancellationPayload = request?.message;

        console.log('processCancellationRequest', request);
        if (request?.verificationResult && cancellationPayload) {
            // Log transaction
            await transactionLog(cancellationPayload);

            if (cancellationPayload?.contractId) {
                let cancellationResponse;

                if (cancellationPayload?.type === 'offer') {
                    // Cancel for consumer
                    cancellationResponse = await signPublishEncryptSend(
                        cancellationPayload, cancellationPayload?.requesterId, cancellationPayload?.requesterTransactionId, 'cancel'
                    );
                } else if (cancellationPayload?.type === 'request') {
                    // Cancel for producer
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
            return { success: true };
        }
        throw new Error('Asset signature verification failed');
    } catch (error) {
        await log(`Transaction cancellation failed. ${error.toString()}`);
        throw new Error(error);
    }
}

export async function processClaimRequest(requestDetails: any): Promise<any> {
    try {
        const request = await decryptVerify(requestDetails);
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
            return { success: true };
        }
        throw new Error('Asset signature verification failed');
    } catch (error) {
        await log(`Contract claim failed. ${error.toString()}`);
        throw new Error(error);
    }
}
