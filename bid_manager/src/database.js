const path = require('path');
const sqlite3 = require('sqlite3');
const { database } = require('../config');

sqlite3.verbose();
const db = new sqlite3.Database(
    path.resolve(__dirname, database), async error => {
        try {
            if (error) {
                return console.error('New database Error', error, path.resolve(__dirname, database));
            }

            await db.run(`CREATE TABLE IF NOT EXISTS offer (
                providerId TEXT, providerTransactionId TEXT, timestamp TEXT, energyAmount REAL, energyPrice REAL, type TEXT, additionalDetails TEXT, walletAddress TEXT)`);

            await db.run(`CREATE TABLE IF NOT EXISTS request (
                requesterId TEXT, requesterTransactionId TEXT, timestamp TEXT, energyAmount REAL, energyPrice REAL, type TEXT, additionalDetails TEXT)`);
        } catch (error) {
            console.log('create', error);
            return null;
        }
    }
);

exports.close = async () => {
    db.close(error => {
        if (error) {
            return console.error(error.message);
        }
    });
};

exports.createOffer = async ({ providerId, providerTransactionId, timestamp, energyAmount, energyPrice, type, additionalDetails = '', walletAddress = '' }) => {
    const query = `
        REPLACE INTO offer (
            providerId, providerTransactionId, timestamp, energyAmount, energyPrice, type, additionalDetails, walletAddress
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    await db.run(query, [providerId, providerTransactionId, timestamp, energyAmount, energyPrice, type, additionalDetails, walletAddress]);
};

exports.createRequest = async ({ requesterId, requesterTransactionId, timestamp, energyAmount, energyPrice, type, additionalDetails = '' }) => {
    const query = `
        REPLACE INTO request (
            requesterId, requesterTransactionId, timestamp, energyAmount, energyPrice, type, additionalDetails
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    await db.run(query, [requesterId, requesterTransactionId, timestamp, energyAmount, energyPrice, type, additionalDetails]);
};

exports.findOffer = async (request) => {
    return new Promise((resolve, reject) => {
        try {
            db.get(`
                SELECT * FROM offer 
                WHERE providerId != '${request.requesterId}'
                AND energyAmount >= ${request.energyAmount}
                AND energyPrice <= ${request.energyPrice}
                ORDER BY timestamp ASC
                LIMIT 1`, (err, row) => {
                    if (err) {
                        return resolve(null);
                    } else {
                        return resolve(row || null);
                    }
            });
        } catch (error) {
            console.log('findOffer', error);
            return reject(null);
        }
    });
};

exports.findRequest = async (offer) => {
    return new Promise((resolve, reject) => {
        try {
            db.get(`
                SELECT * FROM request 
                WHERE requesterId != '${offer.providerId}'
                AND energyAmount <= ${offer.energyAmount}
                AND energyPrice >= ${offer.energyPrice}
                ORDER BY timestamp ASC
                LIMIT 1`, (err, row) => {
                    if (err) {
                        return resolve(null);
                    } else {
                        return resolve(row || null);
                    }
            });
        } catch (error) {
            console.log('findRequest', error);
            return reject(null);
        }
    });
};

exports.removeData = async (table, searchKey = null, searchValue = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            let query = `DELETE FROM ${table}`;
            if (searchKey) {
                query = `${query} WHERE ${searchKey} = '${searchValue}'`;
            }
            await db.run(query);
            resolve();
        } catch (error) {
            console.log('readData', error);
            return reject(null);
        }
    });
};
