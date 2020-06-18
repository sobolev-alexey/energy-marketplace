const crypto = require('crypto');

const getHash = (appId, tripId) => {
  const payload = `${appId}|${tripId}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
};

module.exports = {
  getHash
}