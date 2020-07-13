import { trytesToAscii } from '@iota/converter';
import { composeAPI } from '@iota/core';
import { mamFetchAll } from '@iota/mam.js';
import { provider } from '../config.json';

export const fetchMam = async ({ root, sideKey }) => {
  if (!root || !sideKey) {
    return [];
  }
  
  const promise = new Promise(async (resolve, reject) => {
    try {
      const result = [];
      const iota = composeAPI({ provider });
      const fetched = await mamFetchAll(iota, root, 'restricted', sideKey, 10);
          
      if (fetched && fetched.length > 0) {
        for (let i = 0; i < fetched.length; i++) {
          result.push(JSON.parse(trytesToAscii(fetched[i].message)));
        }
      }

      return resolve(result);
    } catch (error) {
      console.log('MAM fetch error', error);
      return reject();
    }
  });

  return promise;
};