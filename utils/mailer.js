const nodemailer = require('nodemailer');

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const service = process.env.SMTP_SERVICE;
  const isGmail = service === 'gmail' || /gmail\.com/i.test(host || '') || /gmail\.com/i.test(user || '');

  if ((!host && !isGmail) || !user || !pass) {
    throw new Error(
      'Mail configuration is incomplete. Set SMTP_HOST and SMTP_USER/SMTP_PASS, or provide Gmail-compatible SMTP/EMAIL credentials.'
    );
  }

  const config = isGmail
    ? {
        service: 'gmail',
        auth: { user, pass }
      }
    : {
        host,
        port,
        secure: port === 465,
        requireTLS: port !== 465,
        auth: { user, pass }
      };

  return nodemailer.createTransport(config);
};

module.exports = createTransporter;
