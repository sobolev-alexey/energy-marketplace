import { log } from '../utils/loggerHelper';
import { HttpError } from '../errors/httpError';
import { queues, options } from '../utils/queueHelper';

export async function register(_: any, request: any): Promise<any> {
    try {
        if (request) {
            queues.register.add(request, options);
            return { success: true };
        } else {
            await log(`No payload found in register request`);
            throw new HttpError('No payload found in register request', 404);
        }
    } catch (error) {
        await log(`Asset registration failed. ${error.toString()}`);
        throw new Error(error);
    }
}
