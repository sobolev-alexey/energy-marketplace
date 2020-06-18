import { decryptVerify } from '../utils/routineHelper';
import { provideEnergy, receiveEnergy } from '../utils/energyProvisionHelper';
import { readData } from '../utils/databaseHelper';
import { log } from '../utils/loggerHelper';

export default async (job, done) => {
    try {
        await log(`processContract job started`);
        const payload = await decryptVerify(job?.data);        
        if (payload?.verificationResult) {
            const asset: any = await readData('asset');
            if (asset?.type === 'provider') {
                await provideEnergy(payload?.message?.offer);
            } else if (asset?.type === 'requester') {
                await receiveEnergy(payload?.message?.request);
            }

            await log(`Contract processing successful. ${payload?.message?.contractId}`);
            done(null);
        }
        throw new Error('Marketplace signature verification failed');
    } catch (error) {
        console.error('processContract', error);
        await log(`processContract Error ${error.toString()}`);
        done(new Error(`processContract Error ${error.toString()}`));
    }
};
