import randomstring from 'randomstring';
import { readData, writeData } from '../utils/databaseHelper';
import { log, transactionLog } from '../utils/loggerHelper';
import { signPublishEncryptSend } from '../utils/routineHelper';
import { IWallet } from '../models/wallet/IWallet';

export default async (job, done) => {
    try {
        await log(`createTransaction job started`);
        const asset: any = await readData('asset');

        if (asset) {
            const energyData: any = await readData('energy');

            switch (asset.type) {
                case 'requester': {
                    if (energyData?.energyAvailable <= asset?.minOfferAmount * 2 ) {
                        await createRequest(asset);
                    }
                    break; 
                }
                case 'provider':
                default: {
                    if (energyData?.energyAvailable >= asset?.minOfferAmount ) {
                        await createOffer(asset, energyData);
                    }
                    break; 
                }
            }
            done(null);
        }
    } catch (error) {
        console.error('createTransaction', error);
        await log(`createTransaction Error ${error.toString()}`);
        done(new Error(`createTransaction Error ${error.toString()}`));
    }
};

const createOffer = async(asset, energyData) => {
    try {
        // Log event 
        await log('Creating offer...');

        const wallet: IWallet = await readData('wallet');
        if (!wallet) {
            throw new Error('createOffer error. No Wallet');
        }

        // Create payload, specify price and amount
        const status = 'Initial offer';
        const energyToOffer = Number(energyData.energyAvailable);
        const payload: any = await generatePayload(asset, 'offer', status, energyToOffer);
        payload.walletAddress = wallet?.address;

        // Send encrypted payload and signature to Marketplace
        const response = await signPublishEncryptSend(payload, 'offer');
        if (response.success) {
            // Log transaction
            await transactionLog(payload);

            // Reserve energy
            await writeData('energy', { 
                timestamp: Date.now().toString(), 
                energyAvailable: 0,
                energyReserved: Number(energyData.energyReserved) + energyToOffer
            });
        } else {
            await log(`createOffer Error ${response}`);
        }
    } catch (error) {
        console.error('createOffer', error);
        await log(`createOffer Error ${error.toString()}`);
    }
};

const createRequest = async (asset): Promise<void> => {
    try {
        // Log event 
        await log('Creating request...');

        // Create payload, specify price and amount
        const status = 'Initial request';
        const energyToRequest = Number(asset.minOfferAmount);
        const payload: any = await generatePayload(asset, 'request', status, energyToRequest);
        
        // Send encrypted payload and signature to Marketplace
        const response = await signPublishEncryptSend(payload, 'request');
        if (response.success) {
            // Log transaction
            await transactionLog(payload);
        } else {
            await log(`createRequest Error ${response}`);
        }
    } catch (error) {
        console.error('createRequest', error);
        await log(`createRequest Error ${error.toString()}`);
    }
};

const generatePayload = async (asset, type, status, energy): Promise<object> => {
    try {
        if (asset) {
            return {
                type,
                timestamp: Date.now().toString(),
                requesterTransactionId: type === 'request' ? randomstring.generate(20) : '',
                providerTransactionId: type === 'offer' ? randomstring.generate(20) : '',
                energyAmount: energy,
                energyPrice: asset?.maxEnergyPrice,
                location: asset?.location,
                status,
                requesterId: type === 'request' ? asset?.assetId : '',
                providerId: type === 'offer' ? asset?.assetId : '',
                contractId: '',
                walletAddress: '',
                additionalDetails: ''
            };
        }
    } catch (error) {
        console.error('generatePayload', error);
        await log(`generatePayload Error ${error.toString()}`);
    }
};
