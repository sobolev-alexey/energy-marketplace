import randomstring from 'randomstring';
import { 
    energyConsumptionAmount, 
    energyConsumptionSpeed, 
    energyProductionAmount, 
    energyProductionSpeed, 
    transactionCreationSpeed,
    paymentQueueProcessingSpeed,
    pendingTransactionsProcessingSpeed
} from '../config.json';
import { readData, writeData, getAbandonedTransactions, getUnpaidTransactions } from './databaseHelper';
import { log, transactionLog } from './loggerHelper';
import { decryptVerify, signPublishEncryptSend } from './routineHelper';
import { provideEnergy, receiveEnergy, unreserveEnergy } from './energyProvisionHelper';
import { getBalance, processPaymentQueue } from './walletHelper';
import { addToPaymentQueue } from './paymentQueueHelper';
import { paymentConfirmation } from './paymentConfirmationHelper';
import { verifyRequest } from './verificationHelper';

let energyProductionInterval;
let energyConsumptionInterval;
let transactionInterval;

interface IWallet {
    address?: string;
    balance?: number;
    keyIndex?: number;
    seed?: string;
}

// tslint:disable-next-line:typedef
export function BusinessLogic() {
    const createMarketplaceTransaction = async (): Promise<void> => {
        try {
            const asset: any = await readData('asset');

            if (asset) {
                const energyData: any = await readData('energy');

                switch (asset.type) {
                    case 'requester': {
                        if (energyData && energyData.energyAvailable <= asset.minOfferAmount * 2 ) {
                            await createRequest(asset);
                        }
                        break; 
                    }
                    case 'provider':
                    default: {
                        if (energyData && energyData.energyAvailable >= asset.minOfferAmount ) {
                            await createOffer(asset, energyData);
                        }
                        break; 
                    }
                }
            }
        } catch (error) {
            console.error('createMarketplaceTransaction', error);
            await log(`createMarketplaceTransaction Error ${error.toString()}`);
            clearInterval(transactionInterval);
        }
    };

    const createRequest = async (asset): Promise<void> => {
        try {
            // Log event 
            await log('Creating request...');

            // Create payload, specify price and amount
            const status = 'Initial request';
            const energyToRequest = Number(asset.minOfferAmount);
            const payload: any = await generatePayload(asset, 'request', status, energyToRequest);
            
            // Send encrypted payload and signature to Marketplace
            const response = await signPublishEncryptSend(payload, 'request');
            if (response.success) {
                // Log transaction
                await transactionLog(payload);
            } else {
                await log(`createRequest Error ${response}`);
            }
        } catch (error) {
            console.error('createRequest', error);
            await log(`createRequest Error ${error.toString()}`);
        }
    };

    const generatePayload = async (asset, type, status, energy): Promise<object> => {
        try {
            if (asset) {
                return {
                    type,
                    timestamp: Date.now().toString(),
                    requesterTransactionId: type === 'request' ? randomstring.generate(20) : '',
                    providerTransactionId: type === 'offer' ? randomstring.generate(20) : '',
                    energyAmount: energy,
                    energyPrice: asset?.maxEnergyPrice,
                    location: asset?.location,
                    status,
                    requesterId: type === 'request' ? asset?.assetId : '',
                    providerId: type === 'offer' ? asset?.assetId : '',
                    contractId: '',
                    walletAddress: '',
                    additionalDetails: ''
                };
            }
        } catch (error) {
            console.error('generatePayload', error);
            await log(`generatePayload Error ${error.toString()}`);
        }
    };

    const processPayments = async (): Promise<void> => {
        const asset: any = await readData('asset');

        // Check asset type is requester
        if (asset?.type === 'requester') { 
            await processPaymentQueue();
        } else {
            await paymentConfirmation();
        }
    };

    const processPendingTransactions = async (): Promise<void> => {
        const abandonedTransactions: any = await getAbandonedTransactions();
        const unpaidTransactions: any = await getUnpaidTransactions();
        console.log('abandonedTransactions', abandonedTransactions);
        console.log('unpaidTransactions', unpaidTransactions);

        // Cancel abandoned transactions
        abandonedTransactions.forEach(async transaction => 
            await cancelTransaction(transaction));

        if (unpaidTransactions.length > 0) {
            const asset: any = await readData('asset');

            // Check asset type is requester
            if (asset?.type === 'requester') { 
                // Process unpaid transactions
                unpaidTransactions.forEach(async transaction => 
                    await processPayment(transaction));
            } else {
                // Issue claim for unpaid contracts
                unpaidTransactions.forEach(async transaction => 
                    await issueClaim(transaction));
            }
        }
    };

    energyProductionInterval = setInterval(produceEnergy, energyProductionSpeed * 1000);
    energyConsumptionInterval = setInterval(consumeEnergy, energyConsumptionSpeed * 1000);
    transactionInterval = setInterval(createMarketplaceTransaction, transactionCreationSpeed * 1000);
    setInterval(processPayments, paymentQueueProcessingSpeed * 1000);
    setInterval(processPendingTransactions, pendingTransactionsProcessingSpeed * 1000);
}

export async function confirmPaymentProcessing(transactionAsString: string): Promise<void> {
    try {
        const transaction = JSON.parse(transactionAsString);
        const payload = {
            ...transaction,
            timestamp: Date.now().toString(), 
            status: 'Payment processed'
        };
        await transactionLog(payload);

        const response = await signPublishEncryptSend(payload, 'payment_processing');

        // Evaluate response
        if (response?.success) {
            await log(`Payment processing confirmation sent to marketplace and stored. Contract: ${payload.contractId}`);
        } else {
            await log(`Payment processing confirmation failure. Request: ${payload}`);
        }
    } catch (error) {
        await log(`Payment processing confirmation failed. ${error.toString()}`);
        throw new Error(error);
    }
}

export async function processPaymentProcessingConfirmation(request: any): Promise<any> {
    try {
        const payload = await decryptVerify(request);        
        if (payload?.verificationResult) {
            // Update transaction log
            await transactionLog(payload?.message);
            await log(`Payment processing confirmation successful. ${payload?.message?.contractId}`);
            return { success: true };
        }
        throw new Error('Marketplace signature verification failed');
    } catch (error) {
        await log(`Payment processing confirmation failed. ${error.toString()}`);
        throw new Error(error);
    }
}

export async function processPaymentConfirmation(request: any): Promise<any> {
    try {
        const payload = await decryptVerify(request);        
        if (payload?.verificationResult) {
            // Update transaction log
            await transactionLog(payload?.message);
            await log(`Payment confirmation successful. ${payload?.message?.contractId}`);
            return { success: true };
        }
        throw new Error('Marketplace signature verification failed');
    } catch (error) {
        await log(`Payment confirmation failed. ${error.toString()}`);
        throw new Error(error);
    }
}

export async function processCancellationRequest(request: any): Promise<any> {
    try {
        const payload = await decryptVerify(request);        
        if (payload?.verificationResult) {
            // Update transaction log
            await transactionLog(payload?.message);
            await unreserveEnergy(payload?.message);
            await log(`Transaction cancellation successful. TransactionId: ${payload?.message?.requesterTransactionId || payload?.message?.providerTransactionId}`);
            return { success: true };
        }
        throw new Error('Marketplace signature verification failed');
    } catch (error) {
        await log(`Transaction cancellation failed. ${error.toString()}`);
        throw new Error(error);
    }
}

export async function processClaimRequest(request: any): Promise<any> {
    try {
        const payload = await decryptVerify(request);        
        if (payload?.verificationResult) {
            // Update transaction log
            await transactionLog(payload?.message);
            await log(`Contract claim successful. ${payload?.message?.contractId}`);
            return { success: true };
        }
        throw new Error('Marketplace signature verification failed');
    } catch (error) {
        await log(`Contract claim failed. ${error.toString()}`);
        throw new Error(error);
    }
}
