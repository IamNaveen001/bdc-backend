const getAdminEmails = () =>
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const isAdminEmail = (email) => getAdminEmails().includes((email || '').trim().toLowerCase());

module.exports = { getAdminEmails, isAdminEmail };
