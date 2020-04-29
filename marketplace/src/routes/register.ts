import { readData, writeData } from '../utils/databaseHelper';
import { log } from '../utils/loggerHelper';
import { HttpError } from '../errors/httpError';

export async function register(_: any, request: any): Promise<any> {
    console.log('Got registration');
    try {
        if (request) {
            const asset: any = await readData('asset', 'assetId', request.assetId);
            if (!asset) {
                await writeData('asset', request);
            }
            return { success: true };
        } else {
            throw new HttpError('No data found', 404);
        }
    } catch (error) {
        await log(`Registration failed. Error: ${error.toString()}`);
        throw new Error(error);
    }
}
