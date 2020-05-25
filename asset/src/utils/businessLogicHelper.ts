import randomstring from 'randomstring';
import { 
    energyConsumptionAmount, 
    energyConsumptionSpeed, 
    energyProductionAmount, 
    energyProductionSpeed, 
    transactionCreationSpeed,
    paymentQueueProcessingSpeed
} from '../config.json';
import { readData, writeData } from './databaseHelper';
import { log, transactionLog } from './loggerHelper';
import { publish } from './mamHelper';
import { EncryptionService, IMessagePayload } from './encryptionHelper';
import { sendRequest } from './communicationHelper';
import { decryptVerify, signPublishEncryptSend } from './routineHelper';
import { provideEnergy, receiveEnergy } from './energyProvisionHelper';
import { getBalance, processPaymentQueue } from './walletHelper';
import { addToPaymentQueue } from './paymentQueueHelper';
import { paymentConfirmation } from './paymentConfirmationHelper';

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
    let energyAmount: number = 0;
 
    const produceEnergy = async (): Promise<void> => {
        try {
            const asset: any = await readData('asset');

            if (asset) {
                if (asset.type !== 'producer') {
                    clearInterval(energyProductionInterval);
                    return;
                }

                const energy: any = await readData('energy');
                energyAmount = Number(energy && energy.energyAvailable || 0) + energyProductionAmount;
                await writeData('energy', { 
                    timestamp: Date.now().toString(), 
                    energyAvailable: energyAmount,
                    energyReserved: (energy && energy.energyReserved || 0)
                });

                await log(`Produced ${energyProductionAmount} W of energy`);
            }
        } catch (error) {
            console.error('produceEnergy', error);
            await log(`produceEnergy Error ${error.toString()}`);
        }
    };

    const consumeEnergy = async (): Promise<void> => {
        try {
            const asset: any = await readData('asset');

            if (asset) {
                if (asset.type !== 'consumer') {
                    clearInterval(energyConsumptionInterval);
                    return;
                }

                const energy: any = await readData('energy');
                energyAmount = Number(energy && energy.energyAvailable || 0) - energyConsumptionAmount;
                await writeData('energy', { 
                    timestamp: Date.now().toString(), 
                    energyAvailable: energyAmount > 0 ? energyAmount : 0,
                    energyReserved: (energy && energy.energyReserved || 0)
                });

                await log(`Consumed ${energyConsumptionAmount} W of energy`);
            }
        } catch (error) {
            console.error('consumeEnergy', error);
            await log(`consumeEnergy Error ${error.toString()}`);
        }
    };

    const createMarketplaceTransaction = async (): Promise<void> => {
        try {
            const asset: any = await readData('asset');

            if (asset) {
                const energyData: any = await readData('energy');

                switch (asset.type) {
                    case 'consumer': {
                        if (energyData && energyData.energyAvailable <= asset.minOfferAmount * 2 ) {
                            await createRequest(asset);
                        }
                        break; 
                    }
                    case 'producer':
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

    const createOffer = async(asset, energyData) => {
        try {
            // Log event 
            await log('Creating offer...');

            const wallet: IWallet = await readData('wallet');
            if (!wallet) {
                throw new Error('createOffer error. No Wallet');
            }

            // Create payload, specify price and amount
            const status = 'Initial offer';
            const energyToOffer = Number(energyData.energyAvailable);
            const payload: any = await generatePayload(asset, 'offer', status, energyToOffer);
            payload.walletAddress = wallet?.address;

            // Send encrypted payload and signature to Marketplace
            const response = await signPublishEncryptSend(payload, 'offer');
            if (response.success) {
                // Log transaction
                await transactionLog(payload);

                // Reserve energy
                await writeData('energy', { 
                    timestamp: Date.now().toString(), 
                    energyAvailable: 0,
                    energyReserved: Number(energyData.energyReserved) + energyToOffer
                });
            } else {
                await log(`createOffer Error ${response}`);
            }
        } catch (error) {
            console.error('createOffer', error);
            await log(`createOffer Error ${error.toString()}`);
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

        // Check asset type is consumer
        if (asset?.type === 'consumer') { 
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

            // Check asset type is consumer
            if (asset?.type === 'consumer') { 
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

export async function processContract(request: any): Promise<any> {
    try {
        const payload = await decryptVerify(request);        
        if (payload?.verificationResult) {
            const asset: any = await readData('asset');
            if (asset?.type === 'producer') {
                await provideEnergy(payload?.message?.offer);
            } else if (asset?.type === 'consumer') {
                await receiveEnergy(payload?.message?.request);
            }

            await log(`Contract processing successful. ${payload?.message?.contractId}`);
            return { success: true };
        }
        throw new Error('Marketplace signature verification failed');
    } catch (error) {
        await log(`Contract processing failed. ${error.toString()}`);
        throw new Error(error);
    }
}

export async function confirmEnergyProvision(payload: any): Promise<void> {
    try {
        const response = await signPublishEncryptSend(payload, 'provision');

        // Evaluate response
        if (response?.success) {
            await log(`Provision confirmation sent to marketplace and stored. Contract: ${payload.contractId}`);
        } else {
            await log(`Provision confirmation failure. Request: ${payload}`);
        }
    } catch (error) {
        await log(`Provision confirmation failed. ${error.toString()}`);
        throw new Error(error);
    }
}

export async function processPayment(request: any): Promise<any> {
    try {
        const payload = await decryptVerify(request);        
        if (payload?.verificationResult) {
            const message = payload?.message;
            console.log('Payment request', message);

            // Update transaction log
            await transactionLog(message);

            // TODO: verify request

            const paymentAmount = message?.energyAmount * message?.energyPrice;
            const wallet: IWallet = await readData('wallet');
    
            if (!wallet || !wallet?.address) {
                await log('Payment request error. No Wallet');
                throw new Error('Payment request error. No Wallet');
            }

            const balance = await getBalance(wallet?.address);
            if (balance <= paymentAmount) {
                const fundWalletRequest = {
                    assetId: message?.requesterId,
                    walletAddress: wallet?.address,
                    minFundingAmount: paymentAmount
                };
                const fundWalletResponse = await signPublishEncryptSend(fundWalletRequest, 'fund');

                // Evaluate response
                if (fundWalletResponse?.success) {
                    await log(`Wallet funding request sent to asset owner.`);
                } else {
                    await log(`Wallet funding request failure. Request: ${fundWalletRequest}`);
                }
            }
            await addToPaymentQueue(message?.walletAddress, paymentAmount, JSON.stringify(message));

            await log(`Payment request processing successful. ${message?.contractId}`);
            return { success: true };
        }
        throw new Error('Marketplace signature verification failed');
    } catch (error) {
        await log(`Payment request processing failed. ${error.toString()}`);
        throw new Error(error);
    }
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

export async function confirmPayment(transaction: any): Promise<void> {
    try {
        const payload = {
            ...transaction,
            timestamp: Date.now().toString(), 
            status: 'Payment confirmed'
        };
        await transactionLog(payload);

        console.log(131313, payload);

        const response = await signPublishEncryptSend(payload, 'payment_confirmation');

        // Evaluate response
        if (response?.success) {
            await log(`Payment confirmation sent to marketplace and stored. Contract: ${payload.contractId}`);
        } else {
            await log(`Payment confirmation failure. Request: ${payload}`);
        }
    } catch (error) {
        await log(`Payment confirmation failed. ${error.toString()}`);
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
