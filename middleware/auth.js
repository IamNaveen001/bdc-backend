const initFirebaseAdmin = require('../config/firebase');
const User = require('../models/User');

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Missing token' });
    }

    const admin = initFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(token);

    req.user = { uid: decoded.uid, email: decoded.email || '' };
    req.userDb = await User.findOne({ firebaseUid: decoded.uid });
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.userDb || req.userDb.role !== role) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return next();
};

module.exports = { verifyFirebaseToken, requireRole };
