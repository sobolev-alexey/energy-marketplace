import { log } from '../utils/loggerHelper';
import { HttpError } from '../errors/httpError';
import { testMam } from '../utils/mamHelper';

// Endpoint called by bid manager when a match between offer and request is found
export async function test(_: any, payload: any): Promise<any> {
    try {
        if (payload) {
            const { mam, url } = await testMam(payload);
            return { success: true, mam, url };
        } else {
            await log(`No payload found`);
            throw new HttpError('No payload found', 404);
        }
    } catch (error) {
        await log(`Test request failed. ${error.toString()}`);
        throw new Error(error);
    }
}
