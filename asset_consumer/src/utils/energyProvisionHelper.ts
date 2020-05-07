import { readData, writeData } from './databaseHelper';
import { log, transactionLog } from './loggerHelper';
import { confirmEnergyProvision } from './businessLogicHelper';
import { energyProvisionSpeed } from '../config.json';

export const provideEnergy = async (
    location: string, 
    energyProvisionAmount: number, 
    transaction: any
) => {
    try {
        await log(`Energy provision of ${energyProvisionAmount} started to ${location}`);
        await new Promise(resolve => setTimeout(resolve, energyProvisionSpeed * 1000));

        const energy: any = await readData('energy');
        await writeData('energy', { 
            timestamp: Date.now().toString(), 
            energyAvailable: Number(energy && energy.energyAvailable || 0), 
            energyReserved: Number(energy && energy.energyReserved || 0) - energyProvisionAmount
        });

        // Log transaction
        await transactionLog({
            ...transaction,
            timestamp: Date.now().toString(), 
            status: 'Energy provision finished'
        });

        await log(`Energy provision of ${energyProvisionAmount} finished to ${location}`);

        confirmEnergyProvision();
    } catch (error) {
        console.error('provideEnergy', error);
    }
};

export const receiveEnergy = async (
    location: string, 
    energyProvisionAmount: number, 
    transaction: any
) => {
    try {
        await log(`Energy provision of ${energyProvisionAmount} started to ${location}`);
        await new Promise(resolve => setTimeout(resolve, energyProvisionSpeed * 1000));

        const energy: any = await readData('energy');
        await writeData('energy', { 
            timestamp: Date.now().toString(), 
            energyAvailable: Number(energy && energy.energyAvailable || 0) + energyProvisionAmount, 
            energyReserved: Number(energy && energy.energyReserved || 0)
        });

        // Log transaction
        await transactionLog({
            ...transaction,
            timestamp: Date.now().toString(), 
            status: 'Energy provision finished'
        });

        await log(`Energy provision of ${energyProvisionAmount} finished to ${location}`);

        confirmEnergyProvision();
    } catch (error) {
        console.error('receiveEnergy', error);
    }
};
