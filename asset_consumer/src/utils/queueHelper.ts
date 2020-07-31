import Queue from 'bull';
import { setQueues } from 'bull-board';
import redisClient from 'redis';
import { redisHost, redisPortNumber } from '../config.json';
import produceEnergy from '../jobs/produceEnergy';
import consumeEnergy from '../jobs/consumeEnergy';
import createTransaction from '../jobs/createTransaction';
import energyProvision from '../jobs/energyProvision';
import processContract from '../jobs/processContract';
import processPaymentRequest from '../jobs/processPaymentRequest';
import processPayment from '../jobs/processPayment';
import issueClaim from '../jobs/issueClaim';
import cancelTransaction from '../jobs/cancelTransaction';
import confirmProcessing from '../jobs/confirmProcessing';
import confirmPayment from '../jobs/confirmPayment';

const redisTestClient = redisClient.createClient();

export const redisStatus = {
    connected: false,
    error: null
};

redisTestClient.on('connect', () => {
    console.log('Redis connected');
    redisStatus.connected = true;
});

redisTestClient.on('error', err => {
    console.log('Redis failed', err);
    redisStatus.connected = false;
    redisStatus.error = err;
});

const redis = {
    host: redisHost,
    port: redisPortNumber
};

export const options = {
    // delay: 1000, // 1 sec in ms
    attempts: 5,
    backoff: {
        type: 'nodeFailure'
    }
};

function NodeFailureError(): void {}

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

const consumeEnergyQueue = new Queue('consumeEnergyConsumer', { redis, prefix: `{requester}`, settings });
const produceEnergyQueue = new Queue('produceEnergyConsumer', { redis, prefix: `{requester}`, settings });
const transactionQueue = new Queue('createTransactionConsumer', { redis, prefix: `{requester}`, settings });
const energyProvisionQueue = new Queue('energyProvisionConsumer', { redis, prefix: `{requester}`, settings });
const processContractQueue = new Queue('processContractConsumer', { redis, prefix: `{requester}`, settings });
const processPaymentQueue = new Queue('processPaymentConsumer', { redis, prefix: `{requester}`, settings });
const processPaymentRequestQueue = new Queue('processPaymentRequestConsumer', { redis, prefix: `{requester}`, settings });
const issueClaimQueue = new Queue('issueClaimConsumer', { redis, prefix: `{requester}`, settings });
const cancelTransactionQueue = new Queue('cancelTransactionConsumer', { redis, prefix: `{requester}`, settings });
const confirmProcessingQueue = new Queue('confirmProcessingConsumer', { redis, prefix: `{requester}`, settings });
const confirmPaymentQueue = new Queue('confirmPaymentConsumer', { redis, prefix: `{requester}`, settings });

export const queues = {
    consumeEnergy: consumeEnergyQueue,
    produceEnergy: produceEnergyQueue,
    transaction: transactionQueue,
    energyProvision: energyProvisionQueue,
    processContract: processContractQueue,
    processPayment: processPaymentQueue,
    processPaymentRequest: processPaymentRequestQueue,
    issueClaim: issueClaimQueue,
    cancelTransaction: cancelTransactionQueue,
    confirmProcessing: confirmProcessingQueue,
    confirmPayment: confirmPaymentQueue
};

setQueues([ ...Object.values(queues) ]);

queues.produceEnergy.process(produceEnergy);
queues.produceEnergy.on('completed', () => {
    // console.log('produceEnergy job completed');
});

queues.consumeEnergy.process(consumeEnergy);
queues.consumeEnergy.on('completed', () => {
    // console.log('consumeEnergy job completed');
});

queues.transaction.process(createTransaction);
queues.transaction.on('completed', () => {
    console.log('transaction job completed');
});

queues.energyProvision.process(energyProvision);
queues.energyProvision.on('completed', () => {
    console.log('energyProvision job completed');
});

queues.processContract.process(processContract);
queues.processContract.on('completed', () => {
    console.log('processContract job completed');
});

queues.processPaymentRequest.process(processPaymentRequest);
queues.processPaymentRequest.on('completed', () => {
    console.log('processPaymentRequest job completed');
});

queues.processPayment.process(processPayment);
queues.processPayment.on('completed', () => {
    console.log('processPayment job completed');
});

queues.issueClaim.process(issueClaim);
queues.issueClaim.on('completed', () => {
    console.log('issueClaim job completed');
});

queues.cancelTransaction.process(cancelTransaction);
queues.cancelTransaction.on('completed', () => {
    console.log('cancelTransaction job completed');
});

queues.confirmProcessing.process(confirmProcessing);
queues.confirmProcessing.on('completed', () => {
    console.log('confirmProcessing job completed');
});

queues.confirmPayment.process(confirmPayment);
queues.confirmPayment.on('completed', () => {
    console.log('confirmPayment job completed');
});
