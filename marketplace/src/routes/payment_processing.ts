import { log } from '../utils/loggerHelper';
import { HttpError } from '../errors/httpError';
import { queues, options } from '../utils/queueHelper';

// Endpoint called by asset when payment is processed
export async function payment_processing(_: any, request: any): Promise<any> {
    try {
        if (request) {
            queues.payment.add(request, options);
            return { success: true };
        } else {
            await log(`No payload found in payment processing confirmation`);
            throw new HttpError('No payload found in payment processing confirmation', 404);
        }
    } catch (error) {
        await log(`Payment processing confirmation processing failed. ${error.toString()}`);
        throw new Error(error);
    }
}
