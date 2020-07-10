import { signPublishEncryptSend } from '../utils/routineHelper';
import { log } from '../utils/loggerHelper';

export default async (job, done) => {
    try {
        await log(`energyProvision job started`);

        console.log('energyProvision', job?.data);
        const response = await signPublishEncryptSend(job?.data, 'provision');

        // Evaluate response
        if (response?.success) {
            await log(`Provision confirmation sent to marketplace and stored. Contract: ${job?.data?.contractId}`);
        } else {
            await log(`Provision confirmation failure. Request: ${job?.data}`);
        }
        done(null);
    } catch (error) {
        console.error('energyProvision', error);
        await log(`energyProvision Error ${error.toString()}`);
        done(new Error(`energyProvision Error ${error.toString()}`));
    }
};
