import { decryptVerify } from '../utils/routineHelper';
import { log, transactionLog } from '../utils/loggerHelper';
import { verifyRequest } from '../utils/verificationHelper';
import { queues, options } from '../utils/queueHelper';
import { readData } from '../utils/databaseHelper';

export default async (job, done) => {
    try {
        await log(`processPaymentRequest job started`);
        const asset: any = await readData('asset');
        console.log('Payment JOB', asset);
        if (asset?.type === 'requester') {
            const payload = await decryptVerify(job?.data);        
            if (payload?.verificationResult) {
                const transaction = payload?.message;
                const isValidRequest = await verifyRequest(transaction);
                if (isValidRequest) {
                    // Update transaction log
                    await transactionLog(transaction);

                    queues.processPayment.add(transaction, options);
                } else {
                    const timestamp = Date.now().toString();
                    const invalidTransaction = {
                        ...transaction,
                        timestamp, 
                        type: 'request',
                        status: 'Invalid'
                    };

                    await transactionLog(invalidTransaction);
                    await log(`Payment request verification failed. ${JSON.stringify(transaction)}`);
                }
                done(null);
            } else {
                throw new Error('Marketplace signature verification failed');
            }
        }
    } catch (error) {
        console.error('processPaymentRequest', error);
        await log(`processPaymentRequest ${error.toString()}`);
        done(new Error(`processPaymentRequest ${error.toString()}`));
    }
};
