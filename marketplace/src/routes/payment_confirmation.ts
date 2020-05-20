import { log } from '../utils/loggerHelper';
import { HttpError } from '../errors/httpError';
import { processPaymentConfirmation } from '../utils/businessLogic';

// Endpoint called by asset when payment is confirmed
export async function payment_confirmation(_: any, request: any): Promise<any> {
    try {
        if (request) {
            await processPaymentConfirmation(request);
            return { success: true };
        } else {
            await log(`No payload found in payment confirmation`);
            throw new HttpError('No payload found in payment confirmation', 404);
        }
    } catch (error) {
        await log(`Payment confirmation processing failed. ${error.toString()}`);
        throw new Error(error);
    }
}
