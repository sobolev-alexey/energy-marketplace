import { composeAPI, LoadBalancerSettings } from '@iota/client-load-balancer';
import { asTransactionObjects } from '@iota/transaction-converter';
import { decodeMessage } from './helpers';
import { readData, readAllData } from './databaseHelper';
import { log } from './loggerHelper';
import { ServiceFactory } from '../factories/serviceFactory';
import { updateWallet } from './walletHelper';
import { confirmPayment } from './businessLogicHelper';

interface IWallet {
    address?: string;
    balance?: number;
    keyIndex?: number;
    seed?: string;
}

export const paymentConfirmation = async () => {
    try {
        const asset: any = await readData('asset');

        // Check asset type is producer, exit otherwise
        if (asset.type === 'consumer') { return; }
        
        // Check presence of pending payment confirmations
        const pendingPaymentConfirmations: any = await readAllData('transactionLog', 10, 'status', 'Payment processed');
        console.log('pendingPaymentConfirmations', pendingPaymentConfirmations);
        if (!pendingPaymentConfirmations || !pendingPaymentConfirmations.length) {
            console.log('paymentConfirmation: no pending transactions', pendingPaymentConfirmations.length);
            return;
        }

        console.log(1111);
        // Check wallet exists
        const wallet: IWallet = await readData('wallet');
        if (!wallet || !wallet?.address) {
            console.error('paymentConfirmation error: no wallet');
            await log('paymentConfirmation error: no wallet');
        }

        console.log(2222);

        const loadBalancerSettings = ServiceFactory.get<LoadBalancerSettings>(
            `${asset?.network}-load-balancer-settings`
        );
        const iota = composeAPI(loadBalancerSettings);

        // Compare actual and stored wallet balances 
        const { balances } = await iota.getBalances([wallet?.address], 100);
        const balance = balances && balances.length > 0 ? balances[0] : 0;
        
        console.log(3333);

        // Compare actual and stored wallet balances 
        if (balance === wallet?.balance) {
            console.log('paymentConfirmation: wallet balance not changed:', balance);
            return;
        }

        console.log(4444);

        // Check latest transfers to the wallet
        const transfers = [];
        const hashes = await iota.findTransactions({ addresses: [wallet?.address] });
        const nodeInfo = await iota.getNodeInfo();
        const tips = [];
        if (nodeInfo) {
            tips.push(nodeInfo.latestSolidSubtangleMilestone);
        }
        const statesResponses = await iota.getInclusionStates(hashes, tips);
        if (statesResponses.find(state => state)) {
            console.log(5555);

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

            console.log(9999);

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
        console.log(121212);
        await confirmPayment(transaction);
    }
};
