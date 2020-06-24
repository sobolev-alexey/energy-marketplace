import axios from 'axios';
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
export const sendRequest = async (endpoint: string, request: { encrypted: string; userId?: string; }): Promise<IResponse> => {
    const asset: any = await readData('asset');
    
    let baseURL = asset?.marketplaceAPI;
    if (endpoint === 'fund' || endpoint === 'notify_event') {
        baseURL = asset?.assetOwnerAPI;
    }

    const ax = axios.create({ baseURL });
    let response: IResponse;

    try {
        const axiosResponse = await ax.post<IResponse>(endpoint, request);

        response = axiosResponse.data;
    } catch (err) {
        response = {
            success: false,
            message: `There was a problem communicating with the API.\n${err}`
        };
    }

    return response;
};
