import { 
    energyConsumptionSpeed, 
    energyProductionSpeed, 
    transactionCreationSpeed,
    paymentQueueProcessingSpeed,
    pendingTransactionsProcessingSpeed
} from '../config.json';
import { readData, getAbandonedTransactions, getUnpaidTransactions } from './databaseHelper';
import { log, transactionLog } from './loggerHelper';
import { decryptVerify } from './routineHelper';
import { unreserveEnergy } from './energyProvisionHelper';
import { processPaymentQueue } from './walletHelper';
import { paymentConfirmation } from './paymentConfirmationHelper';
import { queues, options } from './queueHelper';

// tslint:disable-next-line:typedef
export function BusinessLogic() {
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
            queues.cancelTransaction.add(transaction, options));

        if (unpaidTransactions.length > 0) {
            const asset: any = await readData('asset');

            // Check asset type is requester
            if (asset?.type === 'requester') { 
                // Process unpaid transactions
                unpaidTransactions.forEach(async transaction => 
                    queues.processPayment.add(transaction, options));
            } else {
                // Issue claim for unpaid contracts
                unpaidTransactions.forEach(async transaction => 
                    queues.issueClaim.add(transaction, options));
            }
        }
    };

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
    setInterval(() => queues.transaction.add({}, options), transactionCreationSpeed * 1000);
    setInterval(() => queues.consumeEnergy.add({}, options), energyConsumptionSpeed * 1000);
    setInterval(() => queues.produceEnergy.add({}, options), energyProductionSpeed * 1000);
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
