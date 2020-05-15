import { readAllData, writeData } from './databaseHelper';

export const addToPaymentQueue = async (address, value) => {
    try {
        await writeData('paymentQueue', { address, value });
    } catch (error) {
        console.error('addToPaymentQueue', address, error);
    }
};

export const getPaymentQueue = async () => {
    try {
        const paymentQueue = await readAllData('paymentQueue', 10);
        return paymentQueue || [];
    } catch (error) {
        console.error('getPaymentQueue', error);
    }
};
