import { readData, writeData } from './databaseHelper';
import { log, transactionLog } from './loggerHelper';
import { energyProvisionSpeed } from '../config.json';
import { queues, options } from './queueHelper';

export const provideEnergy = async (transaction: any): Promise<void> => {
    try {
        // Log transaction
        await transactionLog(transaction);
        
        await log(`Energy provision of ${transaction?.energyAmount} started to ${transaction?.location}`);
        await new Promise(resolve => setTimeout(resolve, energyProvisionSpeed * 1000));

        const energy: any = await readData('energy');
        await writeData('energy', { 
            timestamp: Date.now().toString(), 
            energyAvailable: Number(energy && energy?.energyAvailable || 0), 
            energyReserved: Number(energy && energy?.energyReserved || 0) - Number(transaction?.energyAmount)
        });

        // Log transaction
        const updatedTransactionPayload = {
            ...transaction,
            timestamp: Date.now().toString(), 
            status: 'Energy provision finished'
        };
        await transactionLog(updatedTransactionPayload);

        await log(`Energy provision of ${transaction?.energyAmount} finished to ${transaction?.location}`);

        queues.energyProvision.add(updatedTransactionPayload, options);
    } catch (error) {
        console.error('provideEnergy', error);
    }
};

export const receiveEnergy = async (transaction: any): Promise<void> => {
    try {
        // Log transaction
        await transactionLog(transaction);

        await log(`Energy provision of ${transaction?.energyAmount} started to ${transaction.location}`);
        await new Promise(resolve => setTimeout(resolve, energyProvisionSpeed * 1000));

        const energy: any = await readData('energy');
        await writeData('energy', { 
            timestamp: Date.now().toString(), 
            energyAvailable: Number(energy && energy?.energyAvailable || 0) + Number(transaction?.energyAmount), 
            energyReserved: Number(energy && energy?.energyReserved || 0)
        });

        // Log transaction
        const updatedTransactionPayload = {
            ...transaction,
            timestamp: Date.now().toString(), 
            status: 'Energy provision finished'
        };
        console.log('receiveEnergy 111', updatedTransactionPayload);

        await transactionLog(updatedTransactionPayload);

        await log(`Energy provision of ${transaction?.energyAmount} finished to ${transaction.location}`);

        console.log('receiveEnergy 222', updatedTransactionPayload);
        queues.energyProvision.add(updatedTransactionPayload, options);
    } catch (error) {
        console.error('receiveEnergy', error);
    }
};

export const unreserveEnergy = async (transaction: any): Promise<void> => {
    try {
        // If provider - unreserve energy
        const asset: any = await readData('asset');
        if (asset?.type === 'provider') {
            const energy: any = await readData('energy');
            await writeData('energy', { 
                timestamp: Date.now().toString(), 
                energyAvailable: Number(energy && energy?.energyAvailable || 0) + Number(transaction?.energyAmount), 
                energyReserved: Number(energy && energy?.energyReserved || 0) - Number(transaction?.energyAmount)
            });
        }
    } catch (error) {
        console.error('unreserveEnergy', error);
    }
};
