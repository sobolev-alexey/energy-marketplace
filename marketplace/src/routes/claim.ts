import { log } from '../utils/loggerHelper';
import { HttpError } from '../errors/httpError';
import { queues, options } from '../utils/queueHelper';

// Endpoint called by asset when claim needs to be issued
export async function claim(_: any, request: any): Promise<any> {
    try {
        if (request) {
            queues.issueClaim.add(request, options);
            return { success: true };
        } else {
            await log(`No payload found in claim request`);
            throw new HttpError('No payload found in claim request', 404);
        }
    } catch (error) {
        await log(`Claim processing failed. ${error.toString()}`);
        throw new Error(error);
    }
}
