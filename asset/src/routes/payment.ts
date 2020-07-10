import { log } from '../utils/loggerHelper';
import { HttpError } from '../errors/httpError';
import { queues, options } from '../utils/queueHelper';
import { readData } from '../utils/databaseHelper';

// Endpoint called by marketplace when payment is requested
export async function payment(_: any, request: any): Promise<any> {
    try {
        if (request) {
            const asset: any = await readData('asset');
            if (asset?.type === 'requester') {
                console.log('Payment request API', asset);
                queues.processPaymentRequest.add(request, options);
            }
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
