import Queue from 'bull';
import { setQueues } from 'bull-board';
import Arena from 'bull-arena';
import redisClient from 'redis';
import { redisHost, redisPortNumber } from '../config.json';
import issueClaim from '../jobs/issueClaim';
import cancelTransaction from '../jobs/cancelTransaction';
import processMatch from '../jobs/processMatch';
import provision from '../jobs/provision';
import payment from '../jobs/payment';
import paymentConfirmation from '../jobs/paymentConfirmation';
import register from '../jobs/register';
import offerOrRequest from '../jobs/offerOrRequest';

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

const issueClaimQueue = new Queue('issueClaim', { redis, prefix: `{provider}`, settings });
const cancelTransactionQueue = new Queue('cancelTransaction', { redis, prefix: `{provider}`, settings });
const processMatchQueue = new Queue('processMatch', { redis, prefix: `{provider}`, settings });
const provisionQueue = new Queue('provision', { redis, prefix: `{provider}`, settings });
const paymentQueue = new Queue('payment', { redis, prefix: `{provider}`, settings });
const paymentConfirmationQueue = new Queue('paymentConfirmation', { redis, prefix: `{provider}`, settings });
const registerQueue = new Queue('register', { redis, prefix: `{provider}`, settings });
const offerOrRequestQueue = new Queue('offerOrRequest', { redis, prefix: `{provider}`, settings });

export const queues = {
    issueClaim: issueClaimQueue,
    cancelTransaction: cancelTransactionQueue,
    processMatch: processMatchQueue,
    provision: provisionQueue,
    payment: paymentQueue,
    paymentConfirmation: paymentConfirmationQueue,
    register: registerQueue,
    offerOrRequest: offerOrRequestQueue
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

queues.issueClaim.process(issueClaim);
queues.issueClaim.on('completed', () => {
    console.log('issueClaim job completed');
});

queues.cancelTransaction.process(cancelTransaction);
queues.cancelTransaction.on('completed', () => {
    console.log('cancelTransaction job completed');
});

queues.processMatch.process(processMatch);
queues.processMatch.on('completed', () => {
    console.log('processMatch job completed');
});

queues.provision.process(provision);
queues.provision.on('completed', () => {
    console.log('provision job completed');
});

queues.payment.process(payment);
queues.payment.on('completed', () => {
    console.log('payment job completed');
});

queues.paymentConfirmation.process(paymentConfirmation);
queues.paymentConfirmation.on('completed', () => {
    console.log('paymentConfirmation job completed');
});

queues.register.process(register);
queues.register.on('completed', () => {
    console.log('register job completed');
});

queues.offerOrRequest.process(offerOrRequest);
queues.offerOrRequest.on('completed', () => {
    console.log('offerOrRequest job completed');
});
