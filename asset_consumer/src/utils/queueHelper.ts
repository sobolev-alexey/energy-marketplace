import Queue from 'bull';
import { setQueues } from 'bull-board';
import Arena from 'bull-arena';
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
import confirmPaymentProcessing from '../jobs/confirmPaymentProcessing';
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

const consumeEnergyQueue = new Queue('consumeEnergy', { redis, prefix: `{provider}`, settings });
const produceEnergyQueue = new Queue('produceEnergy', { redis, prefix: `{provider}`, settings });
const transactionQueue = new Queue('createTransaction', { redis, prefix: `{provider}`, settings });
const energyProvisionQueue = new Queue('energyProvision', { redis, prefix: `{provider}`, settings });
const processContractQueue = new Queue('processContract', { redis, prefix: `{provider}`, settings });
const processPaymentQueue = new Queue('processPayment', { redis, prefix: `{provider}`, settings });
const processPaymentRequestQueue = new Queue('processPaymentRequest', { redis, prefix: `{provider}`, settings });
const issueClaimQueue = new Queue('issueClaim', { redis, prefix: `{provider}`, settings });
const cancelTransactionQueue = new Queue('cancelTransaction', { redis, prefix: `{provider}`, settings });
const confirmPaymentProcessingQueue = new Queue('confirmPaymentProcessing', { redis, prefix: `{provider}`, settings });
const confirmPaymentQueue = new Queue('confirmPayment', { redis, prefix: `{provider}`, settings });

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
    confirmPaymentProcessing: confirmPaymentProcessingQueue,
    confirmPayment: confirmPaymentQueue
};

setQueues([ ...Object.values(queues) ]);

export const arenaConfig = Arena(
    {
        queues: Object.keys(queues).map(queue => ({
            name: queue,
            hostId: queue,
            redis
        }))
    },                        
    {
        // basePath: '/arena',
        disableListen: true // Let express handle the listening.
    }
);

queues.produceEnergy.process(produceEnergy);
queues.produceEnergy.on('completed', () => {
    console.log('produceEnergy job completed');
});

queues.consumeEnergy.process(consumeEnergy);
queues.consumeEnergy.on('completed', () => {
    console.log('consumeEnergy job completed');
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

queues.confirmPaymentProcessing.process(confirmPaymentProcessing);
queues.confirmPaymentProcessing.on('completed', () => {
    console.log('confirmPaymentProcessing job completed');
});

queues.confirmPayment.process(confirmPayment);
queues.confirmPayment.on('completed', () => {
    console.log('confirmPayment job completed');
});

// const data1 = {
//     name: 'Alexey'
// };

// const data2 = {
//     name: 'Jane'
// };

// const data3 = {
//     name: 'Mary'
// };

// (async () => {
//     await new Promise(resolveSleep => setTimeout(resolveSleep, 1000));
//     // 2. Adding a Job to the Queue
//     greetQueue.add(data1, options);
//     greetQueue.add(data2, options);
//     await new Promise(resolveSleep => setTimeout(resolveSleep, 1000));
//     greetQueue.add(data3, options);
//     // await new Promise(resolveSleep => setTimeout(resolveSleep, 10000));
// })();

// anotherQueue.process(async (job, done) => { 
//     console.log('Processing...', job.data);
//     const result: any = await greet(job.data);

//     // if (result?.email === 'Specific Error') {
//     //     throw new NodeFailureError();
//     // } else {
//     //     throw new Error();
//     // }
//     done(null, result);
// });

// greetQueue.process(async (job, done) => { 
//     console.log('Processing...', job.data);
//     const result = await greet(job.data); 
//     done(null, result);
// });

// greetQueue.on('completed', (job, result) => {
//     console.log('Job completed with', result?.results?.[0]?.email);
//     // Job completed with output result!
// });

// // myFirstQueue.process('*', (job, done) => {  done() })

// async function greet(payload: any): Promise<void> {
//     return new Promise(async (resolve, reject) => {
//         await new Promise(resolveSleep => setTimeout(resolveSleep, 2000));
//         console.log('Starting job', payload);
        
//         // console.log('Starting job after delay');
//         await fetch('https://randomuser.me/api/?results=1&exc=gender,registered,nat,cell,id')
//             .then(response => response?.json())
//             .then(resolve)
//             .catch(reject);
//         // console.log('After fetch');
//     });
// }
