import path from 'path';
import sqlite3 from 'sqlite3';
import { database } from '../config.json';

sqlite3.verbose();
const db = new sqlite3.Database(
    path.resolve(__dirname, database), async error => {
        if (error) {
            return console.error('New database Error', error, path.resolve(__dirname, database));
        }
        await db.run('CREATE TABLE IF NOT EXISTS asset (assetId TEXT PRIMARY KEY, assetOwner TEXT, type TEXT, network TEXT, exchangeRate REAL, minWalletAmount INTEGER, maxEnergyPrice REAL, minOfferAmount REAL, assetOwnerAPI TEXT, marketplaceAPI TEXT, assetOwnerPublicKey TEXT, marketplacePublicKey TEXT, deviceUUID TEXT, assetName TEXT, location TEXT)');
        await db.run('CREATE TABLE IF NOT EXISTS wallet (seed TEXT PRIMARY KEY, address TEXT, keyIndex INTEGER, balance INTEGER)');
        await db.run('CREATE TABLE IF NOT EXISTS transactionLog (transactionId TEXT, type TEXT, contractId TEXT, timestamp TEXT, requesterId TEXT, providerId TEXT, energyAmount REAL, energyPrice REAL, status TEXT, location TEXT, additionalDetails TEXT)');
        await db.run('CREATE TABLE IF NOT EXISTS keys (privateKey TEXT PRIMARY KEY, publicKey TEXT)');
        await db.run('CREATE TABLE IF NOT EXISTS paymentQueue (address TEXT, value INTEGER)');
        await db.run('CREATE TABLE IF NOT EXISTS log (timestamp TEXT, event TEXT)');
        await db.run('CREATE TABLE IF NOT EXISTS energy (timestamp TEXT, energyAvailable REAL, energyReserved REAL)');
        await db.run('CREATE TABLE IF NOT EXISTS mam (transactionId TEXT PRIMARY KEY, root TEXT, seed TEXT, mode TEXT, sideKey TEXT, security INTEGER, start INTEGER, count INTEGER, nextCount INTEGER, keyIndex INTEGER, nextRoot TEXT)');
     }
);

export const close = async () => {
    db.close(error => {
        if (error) {
            return console.error('DB close', error.message);
        }
    });
};

export const createAsset = async ({ 
    assetId, assetOwner, type, network,
    exchangeRate, minWalletAmount, maxEnergyPrice, 
    minOfferAmount, assetOwnerAPI, marketplaceAPI, 
    assetOwnerPublicKey, marketplacePublicKey, 
    deviceUUID = '', assetName = '', location = '' 
}) => {
    const replace = `
        REPLACE INTO asset (
            assetId, assetOwner, type, network,
            exchangeRate, minWalletAmount, maxEnergyPrice,
            minOfferAmount, assetOwnerAPI, marketplaceAPI,
            assetOwnerPublicKey, marketplacePublicKey,
            deviceUUID, assetName, location
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await db.run(replace, [
        assetId, assetOwner, type, network,
        exchangeRate, minWalletAmount, maxEnergyPrice, 
        minOfferAmount, assetOwnerAPI, marketplaceAPI, 
        assetOwnerPublicKey, marketplacePublicKey, 
        deviceUUID, assetName, location
    ]);
};

export const createKeyStorage = async ({ privateKey, publicKey }) => {
    const replace = `
        REPLACE INTO keys (
            privateKey, publicKey
        ) VALUES (?, ?)`;
    await db.run(replace, [privateKey, publicKey]);
};

export const updateWallet = async ({ seed, address, balance = 0, keyIndex }) => {
    const replace = `
        REPLACE INTO wallet (
            seed, address, balance, keyIndex
        ) VALUES (?, ?, ?, ?)`;
    await db.run(replace, [seed, address, balance, keyIndex]);
};

export const updatePaymentQueue = async ({ address, value }) => {
    const replace = `
        REPLACE INTO paymentQueue (
            address, value
        ) VALUES (?, ?)`;
    await db.run(replace, [address, value]);
};

export const updateEnergyStorage = async ({ timestamp, energyAvailable = 0, energyReserved = 0 }) => {
    const replace = `
        REPLACE INTO energy (
            timestamp, energyAvailable, energyReserved
        ) VALUES (?, ?, ?)`;
    await db.run(replace, [timestamp, energyAvailable, energyReserved]);
};

export const updateMAMChannel = async ({ transactionId, root, seed, mode, sideKey, security, start, count, nextCount, index, nextRoot }) => {
    const replace = `
        REPLACE INTO mam (
            transactionId, root, seed, mode, sideKey, security, start, count, nextCount, keyIndex, nextRoot
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await db.run(replace, [transactionId, root, seed, mode, sideKey, security, start, count, nextCount, index, nextRoot]);
};

export const updateTransactionStorage = async ({ 
    transactionId, type, contractId = '', timestamp, requesterId = '', providerId = '', 
    energyAmount, energyPrice, status, location = '', additionalDetails = ''
}) => {
    const insert = `
        INSERT INTO transactionLog (
            transactionId, type, contractId, timestamp, requesterId, providerId,
            energyAmount, energyPrice, status, location, additionalDetails
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await db.run(insert, [
        transactionId, type, contractId, timestamp, requesterId, providerId, 
        energyAmount, energyPrice, status, location, additionalDetails
    ]);
};

export const updateLogStorage = async ({ timestamp, event }) => {
    const insert = `
        INSERT INTO log (
            timestamp, event
        ) VALUES (?, ?)`;
    await db.run(insert, [timestamp, event]);
};

export const writeData = async (table, data) => {
    try {
        if (table !== 'keys' || table !== 'asset') {
            console.log('writeData', table, data);
        }
        switch (table) {
            case 'asset':
                await createAsset(data);
                return;
            case 'keys':
                await createKeyStorage(data);
                return;
            case 'wallet':
                await updateWallet(data);
                return;
            case 'transaction':
                await updateTransactionStorage(data);
                return;
            case 'log':
                await updateLogStorage(data);
                return;
            case 'energy':
                await updateEnergyStorage(data);
                return;
            case 'paymentQueue':
                await updatePaymentQueue(data);
                return;
            case 'mam':
            default:
                await updateMAMChannel(data);
                return;
        }
    } catch (error) {
        console.log('writeData', error);
        return null;
    }
};

export const readData = async (table, searchKey = null, searchValue = null, limit = null) => {
    return new Promise((resolve, reject) => {
        try {
            let query = `SELECT * FROM ${table} ORDER BY rowid DESC`;
            if (searchKey) {
                query = `SELECT * FROM ${table} WHERE ${searchKey} = '${searchValue}' ORDER BY rowid DESC`;
            }
            if (limit) {
                query = `${query} LIMIT ${limit}`;
            }
            db.get(query, (err, row) => {
                if (err) {
                    return resolve(null);
                } else {
                    return resolve(row || null);
                }
            });
        } catch (error) {
            console.log('readData', error);
            return reject(null);
        }
    });
};

export const readAllData = async (table: string) => {
    return new Promise((resolve, reject) => {
        try {
            db.all(`SELECT * FROM ${table}`, (err, rows) => {
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

export const removeData = async (table: string, searchKey = null, searchValue = null) => {
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

/*
Example write operation:

import { writeData } from './databaseHelper';

const data = {
    address: 'CCCCCDDDDD',
    seed: 'SSSSSSEEEEDDDD',
    amount: 555
};

await writeData('wallet', data);
*/

/*
Example read operation:

import { readData } from './databaseHelper';

const result = await readData(channelId);
if (result) {
    return result;
}

*/

/*
Example delete operation:

import { removeData } from './databaseHelper';

await removeData(entry);

*/
