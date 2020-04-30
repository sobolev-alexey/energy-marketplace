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
                assetId TEXT, transactionId TEXT, timestamp TEXT, energyAmount REAL, price REAL
            )`);

            await db.run(`CREATE TABLE IF NOT EXISTS request (
                assetId TEXT, transactionId TEXT, timestamp TEXT, energyAmount REAL, price REAL
            )`);
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

exports.createOffer = async ({ assetId, transactionId, timestamp, energyAmount, price }) => {
    const query = `
        REPLACE INTO offer (
            assetId TEXT, transactionId TEXT, timestamp TEXT, energyAmount REAL, price REAL
        ) VALUES (?, ?, ?, ?, ?)`;
    await db.run(query, [assetId, transactionId, timestamp, energyAmount, price]);
};

exports.createRequest = async ({ assetId, transactionId, timestamp, energyAmount, price }) => {
    const query = `
        REPLACE INTO request (
            assetId TEXT, transactionId TEXT, timestamp TEXT, energyAmount REAL, price REAL
        ) VALUES (?, ?, ?, ?, ?)`;
    await db.run(query, [assetId, transactionId, timestamp, energyAmount, price]);
};

exports.writeData = async (table, data) => {
    try {
        console.log('writeData', table, data);
        switch (table) {
            case 'offer':
                await createOffer(data);
                return;
            case 'request':
                await createRequest(data);
                return;
            default:
                return;
        }
    } catch (error) {
        console.log('writeData', error);
        return null;
    }
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
