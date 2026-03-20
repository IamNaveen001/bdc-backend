const crypto = require('crypto');

const getSecret = () =>
  process.env.EMERGENCY_RESPONSE_SECRET ||
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
  process.env.SMTP_PASS ||
  'change-this-emergency-response-secret';

const signPayload = (alertId, donorId) =>
  crypto.createHmac('sha256', getSecret()).update(`${alertId}:${donorId}`).digest('hex');

const createResponseToken = ({ alertId, donorId }) => signPayload(alertId, donorId);

const verifyResponseToken = ({ alertId, donorId, token }) => {
  if (!token) return false;

  const expected = signPayload(alertId, donorId);
  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expected);

  if (tokenBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(tokenBuffer, expectedBuffer);
};

module.exports = { createResponseToken, verifyResponseToken };
