const express = require('express');
const bodyParser = require('body-parser');
const { writeData, readAllData, removeData } = require('./database');

const app = express();
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(bodyParser.json());

app.post('/offer', async (req, res) => {
    try {
        console.log('Got offer');
        console.log(req.body);
        const match = await findMatch('request', req.body);
        if (match) { // if there is a match, return match
            await removeData('request', 'transactionId', match.request.transactionId);
            res.json({ status: 'success', match });
        } else { // if no match, store offer
            await writeData('offer', req.body);
            res.json({ status: 'success' });
        }
    } catch (e) {
        console.error(e);
        res.json({ status: 'offer failure', error: JSON.stringify(e) });
    }
});

app.post('/request', async (req, res) => {
    try {
        console.log('Got request');
        console.log(req.body);
        const match = await findMatch('offer', req.body);
        if (match) { // if there is a match, return match
            await removeData('offer', 'transactionId', match.offer.transactionId);
            res.json({ status: 'success', match });
        } else { // if no match, store request
            await writeData('request', req.body);
            res.json({ status: 'success' });
        }
    } catch (e) {
        console.error(e);
        res.json({ status: 'request failure', error: JSON.stringify(e) });
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
                const match = data.find(offer => 
                    offer.assetId !== payload.assetId &&
                    offer.energyAmount >= payload.energyAmount &&
                    offer.price <= payload.price
                );

                console.log('Found matching offer');
                console.log(match, payload);

                return {
                    offer: match,
                    request: payload
                };
            case 'request':
                const match = data.find(request => 
                    request.assetId !== payload.assetId &&
                    request.energyAmount <= payload.energyAmount &&
                    request.price >= payload.price
                );

                console.log('Found matching request');
                console.log(match, payload);

                return {
                    offer: payload,
                    request: match
                };
            default:
                return;
        }

    } catch (error) {
        console.error(error);
    }
}

module.exports = app;
