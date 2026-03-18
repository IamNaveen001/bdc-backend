const express = require('express');
const { body, validationResult } = require('express-validator');
const { listEvents, addEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const eventValidators = [
  body('title').isString().isLength({ min: 3, max: 120 }),
  body('description').isString().isLength({ min: 10, max: 2000 }),
  body('date').isISO8601(),
  body('location').isString().isLength({ min: 2, max: 200 }),
  body('organizer').optional({ checkFalsy: true }).isString().isLength({ min: 2, max: 120 }),
  body('contactPhone').optional({ checkFalsy: true }).isString().isLength({ min: 8, max: 20 })
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return next();
};

router.get('/', listEvents);
router.post('/', verifyFirebaseToken, requireRole('admin'), eventValidators, validate, addEvent);
router.put('/:id', verifyFirebaseToken, requireRole('admin'), eventValidators, validate, updateEvent);
router.delete('/:id', verifyFirebaseToken, requireRole('admin'), deleteEvent);

module.exports = router;
