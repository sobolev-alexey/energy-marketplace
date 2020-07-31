import { energyConsumptionAmount } from '../config.json';
import { readData, writeData } from '../utils/databaseHelper';
import { log } from '../utils/loggerHelper';

export default async (job, done) => {
    try {
        await log(`consumeEnergy job started`);
        const asset: any = await readData('asset');

        if (asset && asset.type === 'requester') {
            const energy: any = await readData('energy');
            const energyAmount = Number(energy && energy.energyAvailable || 0) - energyConsumptionAmount;
            await writeData('energy', { 
                timestamp: Date.now().toString(), 
                energyAvailable: energyAmount > 0 ? energyAmount : 0,
                energyReserved: (energy && energy.energyReserved || 0)
            });

            await log(`Consumed ${energyConsumptionAmount} W of energy`);
        }
        done(null);
    } catch (error) {
        console.error('consumeEnergy', error);
        await log(`consumeEnergy Error ${error.toString()}`);
        done(new Error(`consumeEnergy Error ${error.toString()}`));
    }
};
