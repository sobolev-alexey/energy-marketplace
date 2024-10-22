import { readData, readAllData } from './databaseHelper';
import { log } from './loggerHelper';
import { fetch } from './mamHelper';
import { EncryptionService } from './encryptionHelper';

export async function verifyRequest(request: any): Promise<any> {
    try {
        // Check request status
        if (request?.status !== 'Payment requested') {
            return false;
        }

        // Get transaction from transaction log
        const transactionId = request?.type === 'offer' 
            ? request.providerTransactionId 
            : request.requesterTransactionId;

        const transactions: any = request?.type === 'offer' 
            ? await readAllData('transactionLog', null, 'providerTransactionId', transactionId)
            : await readAllData('transactionLog', null, 'requesterTransactionId', transactionId);
        
        transactions.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

        if (!transactionId || !transactions.length) {
            return false;
        }

        // Get transaction from MAM
        let mamTransactions: any = await fetch(transactionId);
        if (!mamTransactions.length) {
            return false;
        }

        mamTransactions = mamTransactions
            .map(transaction => JSON.parse(transaction))
            .sort((a, b) => Number(a?.message?.timestamp) - Number(b?.message?.timestamp));
        
        const initialTransaction = transactions.find(transaction => transaction.status === 'Initial request');
        const initialTransactionMam = mamTransactions.find(transaction => transaction?.message?.status === 'Initial request');
        const contractTransaction = transactions.find(transaction => transaction.status === 'Contract created');
        
        // Check signature of the first mam message
        const encryptionService = new EncryptionService();
        const keys: any = await readData('keys');
        const verificationResult: boolean = encryptionService.verifySignature(
            keys.publicKey, initialTransactionMam?.message, initialTransactionMam?.signature
        ); 

        if (!verificationResult) {
            return false;
        }

        // Compare transaction object props
        if (!compareObjectProps(initialTransaction, initialTransactionMam?.message, ['contractId', 'requesterTransactionId', 'providerTransactionId', 'energyAmount', 'energyPrice' ])) {
            return false;
        }

        if (!compareObjectProps(initialTransaction, request, ['requesterTransactionId', 'energyAmount', 'location' ])
            || (initialTransaction?.energyPrice < request?.energyPrice)) {
            return false;
        }

        if (!compareObjectProps(contractTransaction, request, ['contractId', 'requesterTransactionId', 'providerTransactionId', 'energyAmount', 'walletAddress', 'providerId', 'location' ])
            || (contractTransaction?.energyPrice < request?.energyPrice)) {
            return false;
        }
    
        return true;
    } catch (error) {
        await log(`verifyRequest failed. ${JSON.stringify(error)}`);
        console.log('verifyRequest failed', request, error);
        return false;
    }
}

const compareObjectProps = (obj1, obj2, props) =>
    !props.find(property => obj1?.[property] !== obj2?.[property]);
