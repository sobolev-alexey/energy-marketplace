import { log } from '../utils/loggerHelper';
import { HttpError } from '../errors/httpError';
import { consumeEnergy } from '../utils/businessLogicHelper';
import { deviceUUID } from '../config.json';

// Endpoint called by physical device when energy was consumed
export async function consume(_: any, request: any): Promise<any> {
    try {
        if (request && request?.uuid && request?.energy) {
            if (request.uuid === deviceUUID) {
                await consumeEnergy(Number(request?.energy));
                return { success: true };
            }
            return { success: false, error: 'Wrong UUID' };
        } else {
            await log(`No payload found in consume request`);
            throw new HttpError('No payload found in consume request', 404);
        }
    } catch (error) {
        await log(`Consume energy processing failed. ${error.toString()}`);
        throw new Error(error);
    }
}
