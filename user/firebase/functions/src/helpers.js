const { getUser } = require('./firebase');
const { EncryptionService } = require('./encryption');

const decryptVerify = async (encrypted, userId) => {
  try {
      if (encrypted && userId) {
          const user = await getUser(userId, true);
          if (user && user.privateKey) {
              const encryptionService = new EncryptionService();

              const decrypted = encryptionService.privateDecrypt(
                user.privateKey, encrypted
              );
  
              const assetId = decrypted.message && decrypted.message.type === 'offer' 
                ? decrypted.message && decrypted.message.providerId 
                : decrypted.message && decrypted.message.requesterId;

              const device = user.devices.find(asset => asset.assetId === assetId);
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

module.exports = {
  decryptVerify
}