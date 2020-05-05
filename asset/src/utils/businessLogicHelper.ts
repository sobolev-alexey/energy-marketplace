import randomstring from 'randomstring';
import { 
    energyConsumptionAmount, 
    energyConsumptionSpeed, 
    energyProductionAmount, 
    energyProductionSpeed, 
    transactionCreationSpeed 
} from '../config.json';
import { readData, writeData } from './databaseHelper';
import { log, transactionLog } from './loggerHelper';
import { publish } from './mamHelper';
import { EncryptionService, IMessagePayload } from './encryptionHelper';
import { sendRequest } from './communicationHelper';

let energyProductionInterval;
let energyConsumptionInterval;
let transactionInterval;

// tslint:disable-next-line:typedef
export function BusinessLogic() {
    let energyAmount: number = 0;
 
    const produceEnergy = async (): Promise<void> => {
        try {
            const asset: any = await readData('asset');

            if (asset) {
                if (asset.type !== 'producer') {
                    clearInterval(energyProductionInterval);
                    return;
                }

                const energy: any = await readData('energy');
                energyAmount = Number(energy && energy.energyAvailable || 0) + energyProductionAmount;
                await writeData('energy', { 
                    timestamp: Date.now().toString(), 
                    energyAvailable: energyAmount,
                    energyReserved: (energy && energy.energyReserved || 0)
                });

                await log(`Produced ${energyProductionAmount} W of energy`);
            }
        } catch (error) {
            console.error('produceEnergy', error);
            await log(`produceEnergy Error ${error.toString()}`);
        }
    };

    const consumeEnergy = async (): Promise<void> => {
        try {
            const asset: any = await readData('asset');

            if (asset) {
                if (asset.type !== 'consumer') {
                    clearInterval(energyConsumptionInterval);
                    return;
                }

                const energy: any = await readData('energy');
                energyAmount = Number(energy && energy.energyAvailable || 0) - energyConsumptionAmount;
                await writeData('energy', { 
                    timestamp: Date.now().toString(), 
                    energyAvailable: energyAmount > 0 ? energyAmount : 0,
                    energyReserved: energy.energyReserved
                });

                await log(`Consumed ${energyConsumptionAmount} W of energy`);
            }
        } catch (error) {
            console.error('consumeEnergy', error);
            await log(`consumeEnergy Error ${error.toString()}`);
        }
    };

    const createMarketplaceTransaction = async (): Promise<void> => {
        try {
            const asset: any = await readData('asset');

            if (asset) {
                const energyData: any = await readData('energy');

                switch (asset.type) {
                    case 'consumer': {
                        if (energyData && energyData.energyAvailable <= asset.minOfferAmount * 2 ) {
                            await createRequest();
                        }
                        break; 
                    }
                    case 'producer':
                    default: {
                        if (energyData && energyData.energyAvailable >= asset.minOfferAmount ) {
                            await createOffer(asset, energyData);
                        }
                        break; 
                    }
                }
            }
        } catch (error) {
            console.error('createMarketplaceTransaction', error);
            await log(`createMarketplaceTransaction Error ${error.toString()}`);
            clearInterval(transactionInterval);
        }
    };

    const createOffer = async(asset, energyData) => {
        try {
            const status = 'Initial offer';

            // Retrieve encryption keys
            const keys: any = await readData('keys');
            if (!keys || !keys.privateKey) {
                throw new Error('No keypair found in database');
            }

            // Log event 
            await log('Creating offer...');

            const energyToOffer = Number(energyData.energyAvailable);

            // Create payload, specify price and amount
            const payload: any = await generatePayload(asset, 'offer', status, energyToOffer);
            console.log(111, payload);

            // Sign payload
            const encryptionService = new EncryptionService();
            const signature: Buffer = encryptionService.signMessage(
                keys?.privateKey, payload
            );
            console.log(222, signature);

            // Publish payload to MAM
            const mam = await publish(payload.transactionId, { message: payload, signature });
            console.log(333, mam);

            // Encrypt payload and signature with Marketplace public key
            const messagePayload: IMessagePayload = { message: payload, signature, mam };
            console.log(444, messagePayload);

            const encrypted: string = encryptionService.publicEncrypt(
                asset?.marketplacePublicKey, JSON.stringify(messagePayload)
            );

            // Send encrypted payload and signature to Marketplace
            const response = await sendRequest('/offer', { encrypted });
            console.log(555, response);

            if (response.success) {
                // Log transaction
                await transactionLog({
                    transactionId: payload.transactionId,
                    timestamp: payload.timestamp, 
                    providerId: payload.assetId,
                    energyAmount: payload.energyAmount, 
                    paymentAmount: payload.energyPrice, 
                    status: payload.status, 
                    contractId: '', 
                    requesterId: '', 
                    additionalDetails: ''
                });

                // Reserve energy
                await writeData('energy', { 
                    timestamp: Date.now().toString(), 
                    energyAvailable: 0,
                    energyReserved: Number(energyData.energyReserved) + energyToOffer
                });
            } else {
                await log(`createOffer Error ${response.message}`);
            }
        } catch (error) {
            console.error('createOffer', error);
            await log(`createOffer Error ${error.toString()}`);
        }
    };

    const createRequest = async (): Promise<void> => {
        try {
            // Log event 
            await log('Creating request...');

            // Create payload, specify price and amount

            // Sign payload

            // Publish payload to MAM

            // Encrypt payload and signature with Marketplace public key

            // Send encrypted payload and signature to Marketplace

            // Log transaction
        } catch (error) {
            console.error('createRequest', error);
            await log(`createRequest Error ${error.toString()}`);
        }
    };

    const generatePayload = async (asset, type, status, energyToOffer): Promise<object> => {
        try {
            // asset ID, type, MAM channel details, public key in a local database
            // replies with MAM root/DID, where public key is stored

            if (asset) {
                return {
                    type,
                    timestamp: Date.now().toString(),
                    transactionId: randomstring.generate(20),
                    assetId: asset.assetId,
                    energyAmount: energyToOffer,
                    energyPrice: asset.maxEnergyPrice,
                    location: asset.location,
                    status
                };
            }
        } catch (error) {
            console.error('generatePayload', error);
            await log(`generatePayload Error ${error.toString()}`);
        }
    };

    energyProductionInterval = setInterval(produceEnergy, energyProductionSpeed * 1000);
    energyConsumptionInterval = setInterval(consumeEnergy, energyConsumptionSpeed * 1000);
    transactionInterval = setInterval(createMarketplaceTransaction, transactionCreationSpeed * 1000);
}
