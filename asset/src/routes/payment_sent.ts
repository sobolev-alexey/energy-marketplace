import { log } from '../utils/loggerHelper';
import { HttpError } from '../errors/httpError';
import { processPaymentProcessingConfirmation } from '../utils/businessLogicHelper';

// Endpoint called by marketplace when payment is sent
export async function payment_sent(_: any, request: any): Promise<any> {
    try {
        if (request) {
            await processPaymentProcessingConfirmation(request);
            return { success: true };
        } else {
            await log(`No payload found in payment request`);
            throw new HttpError('No payload found in payment request', 404);
        }
    } catch (error) {
        await log(`Payment confirmation request processing failed. ${error.toString()}`);
        throw new Error(error);
    }
}
