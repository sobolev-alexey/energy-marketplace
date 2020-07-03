const crypto = require('crypto');
const { generateAddress } = require('@iota/core');
const { getSettings, getUser } = require('./firebase');
const { EncryptionService } = require('./encryption');

const decryptVerify = async (encrypted, userId) => {
  try {
      if (encrypted && userId) {
          const user = await getUser(userId, true);
          if (user && user.privateKey) {
              const encryptionService = EncryptionService();

              const decrypted = encryptionService.privateDecrypt(
                user.privateKey, encrypted
              );
  
              const assetId = decrypted.message && decrypted.message.type === 'offer' 
                ? decrypted.message && decrypted.message.providerId 
                : decrypted.message && decrypted.message.requesterId;

              const device = user.devices.find(asset => asset.id === assetId);

              const verificationResult = encryptionService.verifySignature(
                device.publicKey, decrypted.message, decrypted.signature
              );  
                  
              return { verificationResult, message: decrypted.message };
          }
          throw new Error('No user key');
      } else {
          throw new Error('No encrypted payload found');
      }
  } catch (error) {
      throw new Error(error);
  }
}

const generateSeed = (length = 81) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
  let seed = '';
  while (seed.length < length) {
      const byte = crypto.randomBytes(1);
      if (byte[0] < 243) {
          seed += charset.charAt(byte[0] % 27);
      }
  }
  return seed;
};

const getNewWallet = async () => {
  const settings = await getSettings();
  const security = (settings && settings.tangle && settings.tangle.security) || 2;
  const seed = generateSeed();
  const keyIndex = 0;
  const address = generateAddress(seed, keyIndex, security, true);

  return { seed, address, keyIndex, balance: 0 }
}

module.exports = {
  decryptVerify,
  getNewWallet
}