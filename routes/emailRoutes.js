const express = require('express');
const { body, validationResult } = require('express-validator');
const { sendEmergencyEmail, getEmergencyAlerts, acceptEmergencyResponse } = require('../controllers/emailController');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/emergency/respond', acceptEmergencyResponse);
router.get('/emergency/history', verifyFirebaseToken, requireRole('admin'), getEmergencyAlerts);

router.post(
  '/emergency',
  verifyFirebaseToken,
  requireRole('admin'),
  body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('subject').isString().isLength({ min: 3, max: 150 }),
  body('message').isString().isLength({ min: 5, max: 2000 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return sendEmergencyEmail(req, res, next);
  }
);

module.exports = router;
