import { log, transactionLog } from '../utils/loggerHelper';
import { HttpError } from '../errors/httpError';
import { sendRequest } from '../utils/communicationHelper';
import { decryptVerify } from '../utils/routineHelper';
import { bidManagerURL } from '../config.json';

export async function offerOrRequest(_: any, requestDetails: any): Promise<any> {
    try {
        const request = await decryptVerify(requestDetails);

        if (request?.verificationResult && request?.message) {
            await transactionLog(request?.message);

            // send request to Bid manager, drop response
            const bidManagerEndpoint = `${bidManagerURL}/${request?.message.type}`;   
            await sendRequest(bidManagerEndpoint, request?.message);

            return { success: true };
        }
        throw new HttpError('Asset signature verification failed', 404);
    } catch (error) {
        await log(`Offer/Request creation failed. ${error.toString()}`);
        throw new Error(error);
    }
}
