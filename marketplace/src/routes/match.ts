import { log } from '../utils/loggerHelper';
import { HttpError } from '../errors/httpError';
import { processMatch } from '../utils/businessLogic';

// Endpoint called by bid manager when a match between offer and request is found
export async function match(_: any, requestPayload: any): Promise<any> {
    try {
        if (requestPayload?.request && requestPayload?.offer) {
            processMatch(requestPayload);
            return { success: true };
        } else {
            await log(`No offer or request found in match`);
            throw new HttpError('No offer or request found in match', 404);
        }
    } catch (error) {
        await log(`Match processing failed. ${error.toString()}`);
        throw new Error(error);
    }
}
