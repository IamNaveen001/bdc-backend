const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  registerOrUpdateDonor,
  searchDonors,
  getMyDonor,
  listDonors,
  addDonorAdmin,
  updateDonor,
  deleteDonor
} = require('../controllers/donorController');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const donorValidators = [
  body('name').isString().isLength({ min: 2, max: 100 }),
  body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('age').isInt({ min: 18, max: 65 }),
  body('gender').isIn(['Male', 'Female', 'Other']),
  body('phone').isString().isLength({ min: 8, max: 20 }),
  body('email').isEmail(),
  body('location').isString().isLength({ min: 2, max: 120 }),
  body('lastDonationDate').optional().isISO8601()
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return next();
};

router.get('/', verifyFirebaseToken, searchDonors);
router.get('/me', verifyFirebaseToken, getMyDonor);
router.post('/', verifyFirebaseToken, donorValidators, validate, registerOrUpdateDonor);

router.get('/admin/all', verifyFirebaseToken, requireRole('admin'), listDonors);
router.post('/admin', verifyFirebaseToken, requireRole('admin'), donorValidators, validate, addDonorAdmin);
router.put('/:id', verifyFirebaseToken, requireRole('admin'), donorValidators, validate, updateDonor);
router.delete('/:id', verifyFirebaseToken, requireRole('admin'), deleteDonor);

module.exports = router;
