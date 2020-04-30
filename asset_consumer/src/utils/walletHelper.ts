import { composeAPI, LoadBalancerSettings } from '@iota/client-load-balancer';
import { generateAddress } from '@iota/core';
import axios from 'axios';
import crypto from 'crypto';
import { defaultSecurity } from '../config.json';
import { ServiceFactory } from '../factories/serviceFactory';
import { readData, removeData, writeData } from './databaseHelper';
import { processPaymentQueue } from './paymentQueueHelper';

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

export const generateNewWallet = () => {
    try {
        const seed = generateSeed();
        const address = generateAddress(seed, 0, defaultSecurity, true);
        return { seed, address, keyIndex: 0, balance: 0 };
    } catch (error) {
        console.error('generateNewWallet error', error);
        return {};
    }
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

const transferFunds = async (wallet, totalAmount, transfers) => {
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

                const trytes = await iota.prepareTransfers(seed, transfers, options);
                const transactions = await iota.sendTrytes(trytes, undefined, undefined);

                // Before the payment is confirmed update the wallet with new address and index, calculate expected balance
                await updateWallet(seed, remainderAddress, Number(keyIndex) + 1, balance - totalAmount);

                const hashes = transactions.map(transaction => transaction.hash);

                let retries = 0;
                while (retries++ < 40) {
                    const statuses = await iota.getLatestInclusion(hashes);
                    if (statuses.filter(status => status).length === 4) {
                        break;
                    }
                    await new Promise(resolved => setTimeout(resolved, 5000));
                }

                // Once the payment is confirmed fetch the real wallet balance and update the wallet again
                const newBalance = await getBalance(remainderAddress);
                await updateWallet(seed, remainderAddress, Number(keyIndex) + 1, newBalance);
                
                // remove transfer from the queue
                for (const transfer of transfers) {
                    await removeData('paymentQueue', 'address', transfer?.address);
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

export const processPayment = async () => {
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

        const config: any = await readData('asset');
        const walletBalance = await getBalance(wallet?.address);
        console.log('processPayment check wallet', wallet?.address, walletBalance);
        if (walletBalance <= config.minWalletAmount) {
          const newWallet = generateNewWallet();
          console.log('processPayment generating new wallet', newWallet);
          try {
              const response = await axios.get(`${config.assetOwnerAPI}/faucet?address=${newWallet?.address}`);
              const data = response?.data;
              if (data?.success) {
                  const balance = await getBalance(newWallet?.address);
                  await writeData('wallet', { ...newWallet, balance });
                  return null;
              }
          } catch (error) {
              console.log('fund wallet error', error);
              throw new Error('Wallet funding error');
              return null;
          }
          console.log('processPayment funding new wallet', newWallet);
          return null;
        }

        let totalAmount = 0;
        paymentQueue = await processPaymentQueue();
        console.log('processPayment paymentQueue', paymentQueue);
        paymentQueue.forEach(data => totalAmount += Number(data?.value));
        console.log('processPayment', totalAmount, wallet);
        
        if (paymentQueue?.length === 0 || totalAmount === 0) {
            return null;
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

/*
Example getBalance operation:

import { getBalance } from './walletHelper';

await getBalance(address);

*/

/*
Example payment operation:

import { processPayment } from './walletHelper';

await processPayment();

*/
