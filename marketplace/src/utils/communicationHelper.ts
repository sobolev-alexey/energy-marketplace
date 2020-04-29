import axios from 'axios';
import io from 'socket.io-client';
import { readData } from './databaseHelper';
import { log } from './loggerHelper';

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
export const sendRequest = async (endpoint: string, request: string): Promise<IResponse> => {
    const asset: any = await readData('asset');
    
    const ax = axios.create({ baseURL: asset.marketplaceAPI });
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

const socketOptions = {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 500,
    jsonp: false,
    secure: true,
    reconnectionAttempts: Infinity,
    transports: ['websocket']
};

const connectWebSocket = async (url: string) => {
    return io(url, socketOptions);
};

const disconnectWebSocket = async (socket: any) => {
    if (socket) {
        await socket.off('message');
        await socket.disconnect();
    }
};

export const sendWebSocketMessage = async (url, event, message) => {
    try {
        const socket = await connectWebSocket(url);
        if (socket) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            await socket.emit(event, message);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await disconnectWebSocket(socket);
        }
    } catch (error) {
        console.error('sendWebSocketMessage', error);
        await log(`sendWebSocketMessage Error ${error.toString()}`);
    }
};
