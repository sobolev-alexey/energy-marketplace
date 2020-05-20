import { composeAPI, LoadBalancerSettings } from '@iota/client-load-balancer';
import { generateAddress } from '@iota/core';
import { asciiToTrytes } from '@iota/converter';
import crypto from 'crypto';
import { defaultSecurity } from '../config.json';
import { ServiceFactory } from '../factories/serviceFactory';
import { readData, removeData, writeData } from './databaseHelper';
import { getPaymentQueue } from './paymentQueueHelper';
import { confirmPaymentProcessing } from './businessLogicHelper';

export const generateSeed = (length = 81) => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
    let seed = '';
    while (seed.length < length) {
        const byte = crypto.randomBytes(1);
        if (byte[0] < 243) {
            seed += charset.charAt(byte[0] % 27);
        }
    }
    return seed;
};

export const getBalance = async address => {
    try {
        if (!address) {
            return 0;
        }
        const config: any = await readData('asset');
        const loadBalancerSettings = ServiceFactory.get<LoadBalancerSettings>(
            `${config?.network}-load-balancer-settings`
        );
        const iota = composeAPI(loadBalancerSettings);
        const { balances } = await iota.getBalances([address], 100);
        return balances && balances.length > 0 ? balances[0] : 0;
    } catch (error) {
        console.error('getBalance error', error);
        return 0;
    }
};

const transferFunds = async (wallet, totalAmount, paymentQueue) => {
    try {
        const { address, keyIndex, seed } = wallet;
        const config: any = await readData('asset');
        const loadBalancerSettings = ServiceFactory.get<LoadBalancerSettings>(
            `${config?.network}-load-balancer-settings`
        );
        const iota = composeAPI(loadBalancerSettings);

        const balance = await getBalance(address);

        if (balance === 0) {
            console.error('transferFunds. Insufficient balance', address);
            return null;
        }
        if (balance < totalAmount) {
            throw new Error(`Insufficient balance: ${balance}. Needed: ${totalAmount}`);
        }

        return new Promise(async (resolve, reject) => {
            try {
                const remainderAddress = generateAddress(seed, Number(keyIndex) + 1);
                const options = {
                    inputs: [{
                        address,
                        keyIndex,
                        security: defaultSecurity,
                        balance
                    }],
                    security: defaultSecurity,
                    remainderAddress
                };

                const transfers = paymentQueue.map(transfer => ({ 
                    address: transfer.address, 
                    value: transfer.value,
                    message: asciiToTrytes(JSON.parse(transfer?.transactionPayload)?.contractId)
                }));
                console.log('transfers', transfers);
                const trytes = await iota.prepareTransfers(seed, transfers, options);
                const transactions = await iota.sendTrytes(trytes, undefined, undefined);

                const hashes = transactions.map(transaction => transaction.hash);

                let inclusions = 0;
                let retries = 0;
                let statuses;
                while (retries++ < 60) {
                    statuses = await iota.getLatestInclusion(hashes);
                    inclusions = statuses?.filter(status => status).length;
                    console.log('Inclusions after transfer', retries, inclusions);
                    if (inclusions > transfers.length) {
                        console.log(inclusions);
                        break;
                    }
                    statuses = null;
                    inclusions = 0;
                    
                    await new Promise(resolved => setTimeout(resolved, 5000));
                }

                if (inclusions > transfers.length) {
                    console.log('Inclusions after transfer FINAL', inclusions, statuses);
                    // Once the payment is confirmed fetch the real wallet balance and update the wallet again
                    const newBalance = await getBalance(remainderAddress);
                    await updateWallet(seed, remainderAddress, Number(keyIndex) + 1, newBalance);
                    
                    // remove transfer from the queue
                    for (const transfer of paymentQueue) {
                        await confirmPaymentProcessing(transfer?.transactionPayload);
                        await removeData('paymentQueue', 'address', transfer?.address);
                    }
                }

                resolve(transactions);

            } catch (error) {
                console.error('transferFunds prepareTransfers error', error);
                reject(error);
            }
        });
    } catch (error) {
        console.error('transferFunds catch', error);
        return error;
    }
};

const updateWallet = async (seed, address, keyIndex, balance) => {
    await writeData('wallet', { address, balance, keyIndex, seed });
};

export const processPaymentQueue = async () => {
    let paymentQueue: any = [];
    try {
        console.log('processPayment start');
        interface IWallet {
            address?: string;
            balance?: number;
            keyIndex?: number;
            seed?: string;
        }

        const wallet: IWallet = await readData('wallet');
    
        if (!wallet) {
            console.log('processPayment error. No Wallet');
            return null;
        }

        const walletBalance = await getBalance(wallet?.address);
        console.log('processPayment check wallet', wallet?.address, walletBalance);
        
        let totalAmount = 0;
        paymentQueue = await getPaymentQueue();
        console.log('processPayment paymentQueue', paymentQueue);
        paymentQueue.forEach(data => totalAmount += Number(data?.value));
        console.log('processPayment', totalAmount);
        
        if (paymentQueue?.length === 0 || totalAmount === 0) {
            return null;
        }
        
        if (walletBalance < totalAmount) {
          // Issue fund wallet request
        }

        return await transferFunds(
            wallet,
            totalAmount,
            paymentQueue
        );
    } catch (error) {
        console.error('transferFunds catch', error);
        return error;
    }
};
