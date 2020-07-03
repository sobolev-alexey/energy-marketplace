import { composeAPI, LoadBalancerSettings } from '@iota/client-load-balancer';
import { asTransactionObjects } from '@iota/transaction-converter';
import { decodeMessage } from './helpers';
import { readData, readAllData } from './databaseHelper';
import { log } from './loggerHelper';
import { ServiceFactory } from '../factories/serviceFactory';
import { updateWallet } from './walletHelper';
import { IWallet } from '../models/wallet/IWallet';
import { queues, options } from './queueHelper';

export const paymentConfirmation = async () => {
    try {
        const asset: any = await readData('asset');

        // Check asset type is provider, exit otherwise
        if (asset.type === 'requester') { return; }
        
        // Check presence of pending payment confirmations
        const pendingPaymentConfirmations: any = await readAllData('transactionLog', 10, 'status', 'Payment processed');
        console.log('pendingPaymentConfirmations', pendingPaymentConfirmations);
        if (!pendingPaymentConfirmations || !pendingPaymentConfirmations.length) {
            console.log('paymentConfirmation: no pending transactions', pendingPaymentConfirmations.length);
            return;
        }

        // Check wallet exists
        const wallet: IWallet = await readData('wallet');
        if (!wallet || !wallet?.address) {
            console.error('paymentConfirmation error: no wallet');
            await log('paymentConfirmation error: no wallet');
        }

        const loadBalancerSettings = ServiceFactory.get<LoadBalancerSettings>(
            `${asset?.network}-load-balancer-settings`
        );
        const iota = composeAPI(loadBalancerSettings);

        // Compare actual and stored wallet balances 
        const { balances } = await iota.getBalances([wallet?.address]);
        const balance = balances && balances.length > 0 ? balances[0] : 0;
        
        // Compare actual and stored wallet balances 
        if (balance === wallet?.balance) {
            console.log('paymentConfirmation: wallet balance not changed:', balance);
            return;
        }

        // Check latest transfers to the wallet
        const transfers = [];
        const hashes = await iota.findTransactions({ addresses: [wallet?.address] });
        const statesResponses = await iota.getInclusionStates(hashes);
        if (statesResponses.find(state => state)) {
            const allTrytes = await iota.getTrytes(hashes);
            const transactions = asTransactionObjects(hashes)(allTrytes);

            for (let i = 0; i < statesResponses.length; i++) {
                if (statesResponses[i]) {
                    const { attachmentTimestamp, hash, signatureMessageFragment, value } = transactions[i];
                    const message = decodeMessage(signatureMessageFragment);
                    if (message) {
                        transfers.push({ 
                            timestamp: attachmentTimestamp,
                            message: decodeMessage(signatureMessageFragment),
                            hash,
                            value
                        });
                    }
                }
            }

            transfers
                .sort((a, b) => b.timestamp - a.timestamp)
                .forEach(async transfer => await checkPaymentConfirmation(transfer.message));
        }

        await updateWallet(wallet?.seed, wallet?.address, wallet?.keyIndex, balance);
        
        return;
    } catch (error) {
        console.error('getBalance error', error);
    }
};

const checkPaymentConfirmation = async contractId => {
    const transaction: any = await readData('transactionLog', 'contractId', contractId, 1);
   
    if (transaction?.status === 'Payment processed' || 
        transaction?.status === 'Energy provision finished'
    ) {
        queues.confirmPayment.add(transaction, options);
    }
};
