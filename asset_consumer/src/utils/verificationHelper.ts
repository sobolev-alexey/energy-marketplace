import { readData, readAllData } from './databaseHelper';
import { log } from './loggerHelper';
import { fetch } from './mamHelper';
import { EncryptionService } from './encryptionHelper';

export async function verifyRequest(request: any): Promise<any> {
    try {
        console.log('verifyRequest 01', request?.status);
        // Check request status
        if (request?.status !== 'Payment requested') {
            return false;
        }

        console.log('verifyRequest 02', request?.type);
        // Get transaction from transaction log
        const transactionId = request?.type === 'offer' 
            ? request.providerTransactionId 
            : request.requesterTransactionId;

        const transactions: any = request?.type === 'offer' 
            ? await readAllData('transactionLog', null, 'providerTransactionId', transactionId)
            : await readAllData('transactionLog', null, 'requesterTransactionId', transactionId);
        
        console.log('verifyRequest 03', transactionId);

        transactions.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

        console.log('verifyRequest 04', transactions.length);

        if (!transactionId || !transactions.length) {
            return false;
        }

        console.log('verifyRequest 05');

        // Get transaction from MAM
        let mamTransactions: any = await fetch(transactionId);
        if (!mamTransactions.length) {
            console.log('verifyRequest 666', mamTransactions.length);
            return false;
        }

        console.log('verifyRequest 06', mamTransactions.length);

        mamTransactions = mamTransactions
            .map(transaction => JSON.parse(transaction))
            .sort((a, b) => Number(a?.message?.timestamp) - Number(b?.message?.timestamp));
        
        console.log('verifyRequest 07', mamTransactions);

        const initialTransaction = transactions.find(transaction => transaction.status === 'Initial request');
        const initialTransactionMam = mamTransactions.find(transaction => transaction?.message?.status === 'Initial request');
        const contractTransaction = transactions.find(transaction => transaction.status === 'Contract created');
        
        console.log('verifyRequest 08');

        // Check signature of the first mam message
        const encryptionService = new EncryptionService();
        const keys: any = await readData('keys');
        const verificationResult: boolean = encryptionService.verifySignature(
            keys.publicKey, initialTransactionMam?.message, initialTransactionMam?.signature
        ); 

        console.log('verifyRequest 09', verificationResult);

        if (!verificationResult) {
            return false;
        }

        console.log('verifyRequest 10', initialTransaction, initialTransactionMam?.message);
        // Compare transaction object props
        if (!compareObjectProps(initialTransaction, initialTransactionMam?.message, ['contractId', 'requesterTransactionId', 'providerTransactionId', 'energyAmount', 'energyPrice' ])) {
            console.log('verifyRequest 666 10');
            
            return false;
        }

        console.log('verifyRequest 11', initialTransaction, request);

        if (!compareObjectProps(initialTransaction, request, ['requesterTransactionId', 'energyAmount', 'location' ])
            || (initialTransaction?.energyPrice < request?.energyPrice)) {
            console.log('verifyRequest 666 11');
            
            return false;
        }

        console.log('verifyRequest 13', contractTransaction, request);

        if (!compareObjectProps(contractTransaction, request, ['contractId', 'requesterTransactionId', 'providerTransactionId', 'energyAmount', 'walletAddress', 'providerId', 'location' ])
            || (contractTransaction?.energyPrice < request?.energyPrice)) {
            console.log('verifyRequest 666 13');
            
            return false;
        }
    
        console.log('verifyRequest SUCCESS');

        return true;
    } catch (error) {
        await log(`Payment request verification failed. ${error}`);
        console.log('Payment request verification failed', request, error);
        return false;
    }
}

const compareObjectProps = (obj1, obj2, props) =>
    !props.find(property => obj1?.[property] !== obj2?.[property]);
