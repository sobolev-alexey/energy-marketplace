import { log } from '../utils/loggerHelper';
import { HttpError } from '../errors/httpError';
import { queues, options } from '../utils/queueHelper';

// Endpoint called by asset when payment is confirmed
export async function payment_confirmation(_: any, request: any): Promise<any> {
    try {
        if (request) {
            queues.paymentConfirmation.add(request, options);
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
