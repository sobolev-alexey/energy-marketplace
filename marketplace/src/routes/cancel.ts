import { log } from '../utils/loggerHelper';
import { HttpError } from '../errors/httpError';
import { processCancellationRequest } from '../utils/businessLogic';

// Endpoint called by asset when transaction needs to be cancelled
export async function cancel(_: any, request: any): Promise<any> {
    try {
        if (request) {
            await processCancellationRequest(request);
            return { success: true };
        } else {
            await log(`No payload found in cancellation request`);
            throw new HttpError('No payload found in cancellation request', 404);
        }
    } catch (error) {
        await log(`Cancellation request processing failed. ${error.toString()}`);
        throw new Error(error);
    }
}
