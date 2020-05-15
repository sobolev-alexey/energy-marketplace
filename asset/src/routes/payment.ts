import { log } from '../utils/loggerHelper';
import { HttpError } from '../errors/httpError';
import { processPayment } from '../utils/businessLogicHelper';

// Endpoint called by marketplace when payment is requested
export async function payment(_: any, request: any): Promise<any> {
    try {
        if (request) {
            await processPayment(request);
            return { success: true };
        } else {
            await log(`No payload found in payment request`);
            throw new HttpError('No payload found in payment request', 404);
        }
    } catch (error) {
        await log(`Payment request processing failed. ${error.toString()}`);
        throw new Error(error);
    }
}
