import { readData, writeData } from './databaseHelper';

export const addToPaymentQueue = async (address, value) => {
    try {
        await writeData('paymentQueue', { address, value });
    } catch (error) {
        console.error('addToPaymentQueue', address, error);
    }
};

export const processPaymentQueue = async () => {
    try {
        const currentUserObject = await readData('paymentQueue', null, null, 10);
        return currentUserObject || [];
    } catch (error) {
        console.error('processPaymentQueue', error);
    }
};
