// AES-256-GCM encryption for sealed bid submissions (SOAR 7.7, 8.2).
// Files are encrypted at rest immediately on upload. The key never touches
// the browser and is not accessible through any read endpoint; plaintext is
// only ever produced by the /opening/decrypt route, which itself is gated
// by the multi-person quorum check in middleware/openingQuorum.js.

const crypto = require('crypto');

const ALGO = 'aes-256-gcm';

function getKey() {
  const hex = process.env.SUBMISSION_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('SUBMISSION_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).');
  }
  return Buffer.from(hex, 'hex');
}

function encryptBuffer(plainBuffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

function decryptBuffer(sealedBuffer) {
  const iv = sealedBuffer.subarray(0, 12);
  const authTag = sealedBuffer.subarray(12, 28);
  const ciphertext = sealedBuffer.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function generateReceiptCode() {
  return 'RCPT-' + crypto.randomBytes(8).toString('hex').toUpperCase();
}

module.exports = { encryptBuffer, decryptBuffer, sha256, generateReceiptCode };
