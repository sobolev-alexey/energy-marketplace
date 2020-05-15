import { log } from '../utils/loggerHelper';
import { HttpError } from '../errors/httpError';
import { processContract } from '../utils/businessLogicHelper';

// Endpoint called by marketplace when a contract between offer and request is agreed
export async function contract(_: any, request: any): Promise<any> {
    try {
        if (request) {
            await processContract(request);
            return { success: true };
        } else {
            await log(`No payload found in contract`);
            throw new HttpError('No payload found in contract', 404);
        }
    } catch (error) {
        await log(`Contract processing failed. ${error.toString()}`);
        throw new Error(error);
    }
}
