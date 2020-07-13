import axios from 'axios';
import https from 'https';
import io from 'socket.io-client';
import { log } from './loggerHelper';

interface IResponse {
    success: boolean;
    match?: any;
    message?: any;
}

/**
 * Perform a request to login a user.
 * @param endpoint The API endpoint.
 * @param payload The request to send.
 * @returns The response from the request.
 */
export const sendRequest = async (endpoint: string, payload: object): Promise<IResponse> => {
    let response: IResponse;

    try {
        console.log('sendRequest', endpoint);
        const headers = { 'Content-Type': 'application/json' };
        const httpsAgent = new https.Agent({ rejectUnauthorized: false });
        const axiosResponse = await axios.post<IResponse>(endpoint, payload, { headers, httpsAgent });

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
