import { log } from '../utils/loggerHelper';
import { HttpError } from '../errors/httpError';
import { queues, options } from '../utils/queueHelper';

export async function offerOrRequest(_: any, request: any): Promise<any> {
    try {
        if (request) {
            queues.offerOrRequest.add(request, options);
            return { success: true };
        } else {
            await log(`No payload found in offerOrRequest`);
            throw new HttpError('No payload found in offerOrRequest', 404);
        }
    } catch (error) {
        await log(`Offer/Request creation failed. ${error.toString()}`);
        throw new Error(error);
    }
}
