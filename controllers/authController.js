const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

const getPrimaryAdminEmails = () =>
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

const isPrimaryAdminEmail = (email) => getPrimaryAdminEmails().includes((email || '').toLowerCase());

const ensureUser = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const { uid, email } = req.user;

  let user = await User.findOne({ firebaseUid: uid });

  if (!user) {
    const role = isPrimaryAdminEmail(email) ? 'admin' : 'user';

    user = await User.create({
      firebaseUid: uid,
      email,
      name,
      role
    });
  } else {
    let dirty = false;
    if (name && name !== user.name) {
      user.name = name;
      dirty = true;
    }
    if (email && email !== user.email) {
      user.email = email;
      dirty = true;
    }
    if (dirty) await user.save();
  }

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isPrimaryAdmin: isPrimaryAdminEmail(user.email)
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = req.userDb;
  if (!user) {
    return res.status(404).json({ message: 'User profile not found' });
  }

  return res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isPrimaryAdmin: isPrimaryAdminEmail(user.email)
  });
});

const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 });

  return res.json(
    users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      isPrimaryAdmin: isPrimaryAdminEmail(user.email)
    }))
  );
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  if (String(req.userDb._id) === id) {
    return res.status(400).json({ message: 'You cannot change your own role' });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (isPrimaryAdminEmail(user.email) && role !== 'admin') {
    return res.status(400).json({ message: 'Primary admin access cannot be removed here' });
  }

  user.role = role;
  await user.save();

  return res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isPrimaryAdmin: isPrimaryAdminEmail(user.email)
  });
});

module.exports = { ensureUser, getMe, listUsers, updateUserRole };
