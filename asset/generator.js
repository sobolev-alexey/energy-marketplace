const crypto = require('crypto');
const { v4: uuid } = require("uuid");
const randomstring = require("randomstring");
const NodeRSA = require('node-rsa');
const Queue = require('bull');
const { generateAddress } = require('@iota/core');

const config = {
    "deviceUUID": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "redisHost": "127.0.0.1",
    "serverPortNumber": 7000,
    "websocketPortNumber": 8000,
    "redisPortNumber": 6379,
    "defaultSecurity": 2,
    "defaultDepth": 3,
    "defaultMwm": 9,
    "chunkSize": 20,
    "database": "../../db/energy_broker.sqlite3",
    "mamMode": "RESTRICTED",
    "tag": "ENERGYBROKER",
    "energyProductionSpeed": 400,
    "energyProductionAmount": 50,
    "energyConsumptionSpeed": 400,
    "energyConsumptionAmount": 45,
    "energyProvisionSpeed": 100,
    "transactionCreationSpeed": 2000,
    "paymentQueueProcessingSpeed": 310,
    "pendingTransactionsProcessingSpeed": 600,
    "maxPendingDurationHours": 12
}

const init = {
    "type":"provider",
    "assetName":"energy-producer",
    "assetDescription":"",
    "url":"http://127.0.0.1:7000",
    "exchangeRate": 0.00152,
    "maxEnergyPrice": 3,
    "minOfferAmount": 200,
    "assetOwnerAPI": "https://us-central1-cityexchange-energymarketplace.cloudfunctions.net",
    "marketplaceAPI": "https://cxc02.iota.cafe:5001",
    "assetOwner":"",
    "assetId": "",
    "uuid":"",
    "network":"devnet",
    "location":"Germany",
    "assetWallet":{},
    "marketplacePublicKey":"-----BEGIN%20PUBLIC%20KEY-----%0AMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkCDDKrj3bh%2BXQ4o2YMXn%0AhdEv9Z680mOEbRJTiJX6XOHQZpx7WgIhXCthlCVFSLMnejGG5Zdl06zYm2gUYaKa%0ANhgWc0I%2Ff5gleL9jH3XFDVI4m6y8cW%2Fq%2BPBHcIFlR9vBe8EWQS%2Bpu8imC1N3n%2B5h%0A9M7GcfOI56HbypRDR2VEp4stBpO30X%2FFVIyxA7S%2FF%2FIb3fBa9xLk1s5U1IOeocLe%0AcksWwcbKtWVPvu79QzwHc5XPC1o0r%2FMOQgdT%2BsM%2BxiRv6Dlsi%2B1v%2FeW7HU259A3b%0A1zLR6F2kKLRegnl9%2BBgwFmiveY9zxGU5ke1YQppkwhGyVOovX5plglKt92LHNKP9%0A4QIDAQAB%0A-----END%20PUBLIC%20KEY-----",
    "assetOwnerPublicKey":"",
    "status":"running",
    "dashboard":"enabled"
 }

const generateKeys = () => {
    try {
        const keySize = 2048;
        const rsaKeypair = new NodeRSA({ b: keySize });
        if (rsaKeypair.getKeySize() === keySize && 
            rsaKeypair.getMaxMessageSize() >= Math.round(keySize / 10) &&
            rsaKeypair.isPrivate() &&
            rsaKeypair.isPublic()
        ) {
            return { 
                publicKey: rsaKeypair.exportKey('public'), 
                privateKey: rsaKeypair.exportKey('private')
            };
        } else {
            throw new Error('Key generation failed');
        }
    } catch (error) {
        throw new Error(error);
    }
}

const generateSeed = (length = 81) => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
    let seed = '';
    while (seed.length < length) {
        const byte = crypto.randomBytes(1);
        if (byte[0] < 243) {
            seed += charset.charAt(byte[0] % 27);
        }
    }
    return seed;
};
  
const getNewWallet = async () => {
    const seed = generateSeed();
    const keyIndex = 0;
    const address = generateAddress(seed, keyIndex, 2, true);
    return { seed, address, keyIndex, balance: 0 };
};

const redis = {
    host: config.redisHost,
    port: config.redisPortNumber
};

function NodeFailureError() {}

const settings = {
    stalledInterval: 120000,
    maxStalledCount: 5,
    retryProcessDelay: 20000,
    drainDelay: 50,
    backoffStrategies: {
        nodeFailure: (attemptsMade, err) => {
            if (err instanceof NodeFailureError) {
                return 60000; // Retry in 1 minute
            }
            return 1000;
        }
    }
};

const options = {
    // delay: 1000, // 1 sec in ms
    attempts: 5,
    backoff: {
        type: 'nodeFailure'
    }
};

(async () => {
    console.log('Please wait, your keys are being generated...')
    const wallet = await getNewWallet();
    const keys = generateKeys();

    deviceUUID = uuid();
    config.deviceUUID = deviceUUID;

    init.uuid = deviceUUID;
    init.assetId = randomstring.generate(16);
    init.assetOwner = randomstring.generate(28);
    init.assetOwnerPublicKey = keys.publicKey;
    init.assetWallet = wallet;

    console.log('Your config.json file:');
    console.log(JSON.stringify(config, null, 2));
    console.log('============================================================');

    console.log('Your INIT request:');
    console.log(`curl ${init.url}/init -X POST -H 'Content-Type: application/json' -d '${JSON.stringify(init, null, 2)}'`);
    console.log('============================================================');

    const testQueue = new Queue('testQueue', { redis, settings });
    testQueue.add({test: 'success'}, options);
    testQueue.process('*', (job, done) => {  done(null, job.data) })
    testQueue.on('completed', (job, result) => {
        console.log('Redis test completed with', result);
        process.exit(42);
    });
})();