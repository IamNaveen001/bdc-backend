const admin = require('firebase-admin');

let initialized = false;

const initFirebaseAdmin = () => {
  if (initialized) return admin;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!json && !path) {
    throw new Error('Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH');
  }

  const credential = json
    ? admin.credential.cert(JSON.parse(json))
    : admin.credential.cert(require(path));

  admin.initializeApp({ credential });
  initialized = true;
  return admin;
};

module.exports = initFirebaseAdmin;
