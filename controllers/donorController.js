const Donor = require('../models/Donor');
const asyncHandler = require('../middleware/asyncHandler');
const createTransporter = require('../utils/mailer');
const donorWelcomeTemplate = require('../utils/donorWelcomeTemplate');

const registerOrUpdateDonor = asyncHandler(async (req, res) => {
  const data = {
    name: req.body.name,
    bloodGroup: req.body.bloodGroup,
    age: req.body.age,
    gender: req.body.gender,
    phone: req.body.phone,
    email: req.body.email,
    location: req.body.location,
    lastDonationDate: req.body.lastDonationDate || null,
    createdBy: req.userDb ? req.userDb._id : null
  };

  let donor = await Donor.findOne({ createdBy: req.userDb?._id });

  // Update flow (no email)
  if (donor) {
    Object.assign(donor, data);
    await donor.save();
    return res.json(donor);
  }

  // Create flow (send email)
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

  const donor = await Donor.findOne({ createdBy: req.userDb._id });
  if (!donor) return res.status(404).json({ message: 'Donor not found' });
  return res.json(donor);
});

const listDonors = asyncHandler(async (req, res) => {
  const donors = await Donor.find({}).sort({ createdAt: -1 });
  return res.json(donors);
});

const addDonorAdmin = asyncHandler(async (req, res) => {
  const donor = await Donor.create({
    name: req.body.name,
    bloodGroup: req.body.bloodGroup,
    age: req.body.age,
    gender: req.body.gender,
    phone: req.body.phone,
    email: req.body.email,
    location: req.body.location,
    lastDonationDate: req.body.lastDonationDate || null,
    createdBy: req.body.createdBy || null
  });
  return res.status(201).json(donor);
});

const updateDonor = asyncHandler(async (req, res) => {
  const donor = await Donor.findById(req.params.id);
  if (!donor) return res.status(404).json({ message: 'Donor not found' });

  Object.assign(donor, req.body);
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
