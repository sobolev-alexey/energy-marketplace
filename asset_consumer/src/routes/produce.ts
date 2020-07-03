import { log } from '../utils/loggerHelper';
import { HttpError } from '../errors/httpError';
import { produceEnergy } from '../utils/businessLogicHelper';
import { deviceUUID } from '../config.json';

// Endpoint called by physical device when energy was produced
export async function produce(_: any, request: any): Promise<any> {
    try {
        if (request && request?.uuid && request?.energy) {
            if (request.uuid === deviceUUID) {
                await produceEnergy(Number(request?.energy));
                return { success: true };
            }
            return { success: false, error: 'Wrong UUID' };
        } else {
            await log(`No payload found in produce request`);
            throw new HttpError('No payload found in produce request', 404);
        }
    } catch (error) {
        await log(`Produce energy processing failed. ${error.toString()}`);
        throw new Error(error);
    }
}
