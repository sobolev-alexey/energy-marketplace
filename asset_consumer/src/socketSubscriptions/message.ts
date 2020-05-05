import { IMessagePayload } from '../models/IMessagePayload';

/**
 * Process message payload
 * @param payload The payload.
 */
export function message(payload: IMessagePayload): void {
    try {
        console.log('WebSocket message received');
        console.log(payload);
    } catch (err) {
        console.error('WS error', err);
    }
}

/**
 * Process message payload
 * @param payload The payload.
 */
export function message1(payload: IMessagePayload): void {
    try {
        console.log('WebSocket message received');
        console.log(payload);
    } catch (err) {
        console.error('WS error', err);
    }
}

/**
 * Process message payload
 * @param payload The payload.
 */
export function message2(payload: IMessagePayload): void {
    try {
        console.log('WebSocket message received');
        console.log(payload);
    } catch (err) {
        console.error('WS error', err);
    }
}
