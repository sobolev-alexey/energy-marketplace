const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const { createRequest, createOffer, findRequest, findOffer, removeData } = require('./database');
const { marketplace } = require('../config');

const app = express();
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(bodyParser.json());

app.post('/offer', async (req, res) => {
    try {
        console.log('Got offer');
        findMatch('request', req.body);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.json({ success: false, error: JSON.stringify(e) });
    }
});

app.post('/request', async (req, res) => {
    try {
        console.log('Got request');
        findMatch('offer', req.body);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.json({ success: false, error: JSON.stringify(e) });
    }
});

const findMatch = async (table, payload) => {
    const start = Date.now();
    try {
        console.log('Looking for matching', table, payload);
        // Rules:
        // energy amount offered >= energy amount requested
        // energy price offered <= energy price requested
        // offer assetId !== request assetId
        switch (table) {
            case 'offer':
                const matchingOffer = await findOffer(payload);
                console.log('findOffer', matchingOffer);

                if (matchingOffer) {
                    const response = await sendMatch({
                        offer: matchingOffer,
                        request: { ...payload, assetId: payload.requesterId }
                    });

                    if (response && response.success) {
                        await removeData('offer', 'transactionId', matchingOffer.transactionId);
                    }
                    console.log(`<=== duration: ${Date.now() - start}ms`);
                } else {
                    // if no match, store request
                    await createRequest(payload);
                }
                return null;
            case 'request':
                const matchingRequest = await findRequest(payload);
                console.log('findRequest', matchingRequest);

                if (matchingRequest) {
                    const response = sendMatch({
                        offer: { ...payload, assetId: payload.providerId },
                        request: matchingRequest
                    });

                    if (response && response.success) {
                        await removeData('request', 'transactionId', matchingRequest.transactionId);
                    }
                    console.log(`<=== duration: ${Date.now() - start}ms`);
                } else {
                    // if no match, store offer
                    await createOffer(payload);
                }
                return null;
            default:
                return;
        }

    } catch (error) {
        console.error(error);
    }
}

const sendMatch = async payload => {
    try {
        const axiosResponse = await axios.post(marketplace, payload);
        console.log('sendMatch response', axiosResponse.data);
        return axiosResponse.data;
    } catch (error) {
        return { success: false };
    }
}

module.exports = app;
