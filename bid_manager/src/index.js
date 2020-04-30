const express = require('express');
const bodyParser = require('body-parser');
const { createRequest, createOffer, readAllData, removeData } = require('./database');

const app = express();
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(bodyParser.json());

app.post('/offer', async (req, res) => {
    try {
        console.log('Got offer');
        const match = await findMatch('request', req.body);
        if (match) { // if there is a match, return match
            await removeData('request', 'transactionId', match.request.transactionId);
            res.json({ success: true, match });
        } else { // if no match, store offer
            await createOffer(req.body);
            res.json({ success: true });
        }
    } catch (e) {
        console.error(e);
        res.json({ success: false, error: JSON.stringify(e) });
    }
});

app.post('/request', async (req, res) => {
    try {
        console.log('Got request');
        const match = await findMatch('offer', req.body);
        if (match) { // if there is a match, return match
            await removeData('offer', 'transactionId', match.offer.transactionId);
            res.json({ success: true, match });
        } else { // if no match, store request
            await createRequest(req.body);
            res.json({ success: true });
        }
    } catch (e) {
        console.error(e);
        res.json({ success: false, error: JSON.stringify(e) });
    }
});

const findMatch = async (table, payload) => {
    try {
        console.log('Looking for match', table, payload);
        const data = await readAllData(table);
        // Rules:
        // energy amount offered >= energy amount requested
        // energy price offered <= energy price requested
        // offer assetId !== request assetId
        switch (table) {
            case 'offer':
                const matchingOffer = data.find(offer => 
                    offer.assetId !== payload.assetId &&
                    offer.energyAmount >= payload.energyAmount &&
                    offer.energyPrice <= payload.energyPrice
                );

                if (matchingOffer) {
                    console.log('Found matching offer');
                    console.log(matchingOffer, payload);
    
                    return {
                        offer: matchingOffer,
                        request: payload
                    };
                }
                return null;
            case 'request':
                const matchingRequest = data.find(request => 
                    request.assetId !== payload.assetId &&
                    request.energyAmount <= payload.energyAmount &&
                    request.energyPrice >= payload.energyPrice
                );

                if (matchingRequest) {
                    console.log('Found matching request');
                    console.log(matchingRequest, payload);

                    return {
                        offer: payload,
                        request: matchingRequest
                    };
                }
                return null;
            default:
                return;
        }

    } catch (error) {
        console.error(error);
    }
}

module.exports = app;
