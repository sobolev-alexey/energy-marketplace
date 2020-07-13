import axios from 'axios';
import https from 'https';
import { readData } from './databaseHelper';

interface IResponse {
    success: boolean;
    message: any;
}

/**
 * Perform a request to login a user.
 * @param endpoint The API endpoint.
 * @param request The request to send.
 * @returns The response from the request.
 */
export const sendRequest = async (
    endpoint: string, 
    request: { encrypted: string; userId?: string; keyIndex?: number; }
): Promise<IResponse> => {
    const asset: any = await readData('asset');
    
    let baseURL = asset?.marketplaceAPI;
    if (endpoint === 'fund' || endpoint === 'notify_event') {
        baseURL = asset?.assetOwnerAPI;
    }

    const ax = axios.create({ baseURL });
    let response: IResponse;

    try {
        console.log('sendRequest', endpoint);
        const headers = { 'Content-Type': 'application/json' };
        const httpsAgent = new https.Agent({ rejectUnauthorized: false });
        const axiosResponse = await ax.post<IResponse>(endpoint, request, { headers, httpsAgent });

        response = axiosResponse.data;
        console.log('sendRequest response', response);
    } catch (err) {
        response = {
            success: false,
            message: `There was a problem communicating with the API.\n${err}`
        };
        console.log('sendRequest ERROR response', response);
    }

    return response;
};
