const express = require('express');
const { body } = require('express-validator');
const { ensureUser, getMe, listUsers, updateUserRole } = require('../controllers/authController');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.post(
  '/ensure',
  verifyFirebaseToken,
  body('name').optional().isString().isLength({ min: 2, max: 100 }),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return ensureUser(req, res, next);
  })
);

router.get('/me', verifyFirebaseToken, getMe);
router.get('/users', verifyFirebaseToken, requireRole('admin'), listUsers);
router.patch(
  '/users/:id/role',
  verifyFirebaseToken,
  requireRole('admin'),
  body('role').isIn(['user', 'admin']),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return updateUserRole(req, res, next);
  })
);

module.exports = router;
