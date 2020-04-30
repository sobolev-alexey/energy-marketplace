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
                assetId TEXT, transactionId TEXT, timestamp TEXT, energyAmount REAL, energyPrice REAL)`);

            await db.run(`CREATE TABLE IF NOT EXISTS request (
                assetId TEXT, transactionId TEXT, timestamp TEXT, energyAmount REAL, energyPrice REAL)`);
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

exports.createOffer = async ({ assetId, transactionId, timestamp, energyAmount, energyPrice }) => {
    const query = `
        REPLACE INTO offer (
            assetId, transactionId, timestamp, energyAmount, energyPrice
        ) VALUES (?, ?, ?, ?, ?)`;
    await db.run(query, [assetId, transactionId, timestamp, energyAmount, energyPrice]);
};

exports.createRequest = async ({ assetId, transactionId, timestamp, energyAmount, energyPrice }) => {
    const query = `
        REPLACE INTO request (
            assetId, transactionId, timestamp, energyAmount, energyPrice
        ) VALUES (?, ?, ?, ?, ?)`;
    await db.run(query, [assetId, transactionId, timestamp, energyAmount, energyPrice]);
};

exports.readAllData = async (table) => {
    return new Promise((resolve, reject) => {
        try {
            db.all(`SELECT * FROM ${table} ORDER BY timestamp DESC`, (err, rows) => {
                if (err) {
                    return resolve(null);
                } else {
                    return resolve(rows);
                }
            });
        } catch (error) {
            console.log('readAllData', error);
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
