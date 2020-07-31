import { energyProductionAmount } from '../config.json';
import { readData, writeData } from '../utils/databaseHelper';
import { log } from '../utils/loggerHelper';

export default async (job, done) => {
    try {
        await log(`produceEnergy job started`);
        const asset: any = await readData('asset');

        if (asset && asset.type === 'provider') {
            const energy: any = await readData('energy');
            const energyAmount = Number(energy && energy.energyAvailable || 0) + energyProductionAmount;
            await writeData('energy', { 
                timestamp: Date.now().toString(), 
                energyAvailable: energyAmount,
                energyReserved: (energy && energy.energyReserved || 0)
            });

            await log(`Produced ${energyProductionAmount} W of energy`);
        }
        done(null);
    } catch (error) {
        console.error('produceEnergy', error);
        await log(`produceEnergy Error ${error.toString()}`);
        done(new Error(`produceEnergy Error ${error.toString()}`));
    }
};
