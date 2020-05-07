import { log } from '../utils/loggerHelper';
import { HttpError } from '../errors/httpError';
import { processProvisionConfirmation } from '../utils/businessLogic';

// Endpoint called by asset when energy provision is finished
export async function provision(_: any, request: any): Promise<any> {
    try {
        if (request) {
            processProvisionConfirmation(request);
            return { success: true };
        } else {
            await log(`No payload found in provision confirmation`);
            throw new HttpError('No payload found in provision confirmation', 404);
        }
    } catch (error) {
        await log(`Provision confirmation processing failed. ${error.toString()}`);
        throw new Error(error);
    }
}
