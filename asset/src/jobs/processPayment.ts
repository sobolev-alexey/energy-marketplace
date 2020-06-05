import { signPublishEncryptSend } from '../utils/routineHelper';
import { log } from '../utils/loggerHelper';
import { readData } from '../utils/databaseHelper';
import { getBalance } from '../utils/walletHelper';
import { addToPaymentQueue } from '../utils/paymentQueueHelper';
import { IWallet } from '../models/wallet/IWallet';

export default async (job, done) => {
    try {
        await log(`processPayment job started`);
        const paymentAmount = job?.data?.energyAmount * job?.data?.energyPrice;
        const wallet: IWallet = await readData('wallet');

        if (!wallet || !wallet?.address) {
            await log('Payment request error. No Wallet');
            throw new Error('Payment request error. No Wallet');
        }

        const balance = await getBalance(wallet?.address);
        if (balance <= paymentAmount) {
            const fundWalletRequest = {
                assetId: job?.data?.requesterId,
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
        await addToPaymentQueue(job?.data?.walletAddress, paymentAmount, JSON.stringify(job?.data));

        await log(`Payment request processing successful. ${job?.data?.contractId}`);

        done(null);
    } catch (error) {
        console.error('processPayment', error);
        await log(`processPayment Error ${error.toString()}`);
        done(new Error(`processPayment Error ${error.toString()}`));
    }
};
