import { decryptVerify } from '../utils/routineHelper';
import { log, transactionLog } from '../utils/loggerHelper';
import { sendRequest } from '../utils/communicationHelper';
import { bidManagerURL } from '../config.json';

export default async (job, done) => {
    try {
        await log(`offerOrRequest job started`);
        const request = await decryptVerify(job?.data);

        if (request?.verificationResult && request?.message) {
            await transactionLog(request?.message);

            // send request to Bid manager, drop response
            const bidManagerEndpoint = `${bidManagerURL}/${request?.message.type}`;   
            await sendRequest(bidManagerEndpoint, request?.message);

            done(null);
        }
        await log('Asset signature verification failed');
        done(new Error('Asset signature verification failed'));
    } catch (error) {
        console.error('offerOrRequest', error);
        await log(`offerOrRequest Error ${error.toString()}`);
        done(new Error(`offerOrRequest Error ${error.toString()}`));
    }
};
