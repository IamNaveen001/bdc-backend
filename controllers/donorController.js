const Donor = require('../models/Donor');
const asyncHandler = require('../middleware/asyncHandler');
const createTransporter = require('../utils/mailer');
const donorWelcomeTemplate = require('../utils/donorWelcomeTemplate');

const normalizeEmail = (value = '') => String(value).trim().toLowerCase();

const registerOrUpdateDonor = asyncHandler(async (req, res) => {
  if (!req.userDb) {
    return res.status(401).json({ message: 'User profile not found for this token' });
  }

  const accountEmail = normalizeEmail(req.user?.email);
  const bodyEmail = normalizeEmail(req.body.email);

  if (accountEmail && bodyEmail && accountEmail !== bodyEmail) {
    return res.status(400).json({ message: 'Donor email must match your login email' });
  }

  const resolvedEmail = accountEmail || bodyEmail;

  if (!resolvedEmail) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const data = {
    name: req.body.name,
    bloodGroup: req.body.bloodGroup,
    age: req.body.age,
    gender: req.body.gender,
    phone: req.body.phone,
    email: resolvedEmail,
    location: req.body.location,
    lastDonationDate: req.body.lastDonationDate || null,
    createdBy: req.userDb._id
  };

  const [donorByOwner, donorByEmail] = await Promise.all([
    Donor.findOne({ createdBy: req.userDb._id }),
    Donor.findOne({ email: resolvedEmail })
  ]);

  // If both checks point to different records, refuse to create/update blindly.
  if (donorByOwner && donorByEmail && String(donorByOwner._id) !== String(donorByEmail._id)) {
    return res.status(409).json({
      message:
        'Duplicate donor records detected for this account/email. Please ask admin to remove one duplicate entry.'
    });
  }

  let donor = donorByOwner || donorByEmail;

  // Update existing donor (either owned by user or pre-created by admin with same email)
  if (donor) {
    Object.assign(donor, data);
    await donor.save();
    return res.json(donor);
  }

  // Create new donor (send welcome email once)
  donor = await Donor.create(data);

  // Send congratulations email
  if (donor.email) {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: donor.email,
      subject: 'Thank you for registering as a Blood Donor',
      html: donorWelcomeTemplate({
        name: donor.name,
        bloodGroup: donor.bloodGroup
      })
    });
  }

  return res.status(201).json(donor);
});

const searchDonors = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.bloodGroup) filters.bloodGroup = req.query.bloodGroup;
  if (req.query.location) {
    filters.location = new RegExp(req.query.location, 'i');
  }

  const donors = await Donor.find(filters).sort({ createdAt: -1 });
  return res.json(donors);
});

const getMyDonor = asyncHandler(async (req, res) => {
  if (!req.userDb) return res.status(404).json({ message: 'Donor not found' });

  const userEmail = normalizeEmail(req.user?.email || req.userDb.email);
  const donor = await Donor.findOne({
    $or: [{ createdBy: req.userDb._id }, { email: userEmail }]
  }).sort({ createdAt: -1 });

  if (!donor) return res.status(404).json({ message: 'Donor not found' });

  // Auto-link admin-created donor entry to the logged-in user.
  if (!donor.createdBy || String(donor.createdBy) !== String(req.userDb._id)) {
    donor.createdBy = req.userDb._id;
    await donor.save();
  }

  return res.json(donor);
});

const listDonors = asyncHandler(async (req, res) => {
  const donors = await Donor.find({}).sort({ createdAt: -1 });
  return res.json(donors);
});

const addDonorAdmin = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const existing = await Donor.findOne({ email });

  if (existing) {
    return res.status(409).json({ message: 'A donor with this email already exists' });
  }

  const donor = await Donor.create({
    name: req.body.name,
    bloodGroup: req.body.bloodGroup,
    age: req.body.age,
    gender: req.body.gender,
    phone: req.body.phone,
    email,
    location: req.body.location,
    lastDonationDate: req.body.lastDonationDate || null,
    createdBy: req.body.createdBy || null
  });
  return res.status(201).json(donor);
});

const updateDonor = asyncHandler(async (req, res) => {
  const donor = await Donor.findById(req.params.id);
  if (!donor) return res.status(404).json({ message: 'Donor not found' });

  const nextEmail = normalizeEmail(req.body.email);
  const conflict = await Donor.findOne({
    email: nextEmail,
    _id: { $ne: donor._id }
  });

  if (conflict) {
    return res.status(409).json({ message: 'A donor with this email already exists' });
  }

  Object.assign(donor, req.body, { email: nextEmail });
  await donor.save();
  return res.json(donor);
});

const deleteDonor = asyncHandler(async (req, res) => {
  const donor = await Donor.findById(req.params.id);
  if (!donor) return res.status(404).json({ message: 'Donor not found' });

  await donor.deleteOne();
  return res.json({ message: 'Donor removed' });
});

module.exports = {
  registerOrUpdateDonor,
  searchDonors,
  getMyDonor,
  listDonors,
  addDonorAdmin,
  updateDonor,
  deleteDonor
};
