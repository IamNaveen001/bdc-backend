const Donor = require('../models/Donor');
const EmergencyAlert = require('../models/EmergencyAlert');
const asyncHandler = require('../middleware/asyncHandler');
const createTransporter = require('../utils/mailer');
const { getAdminEmails } = require('../utils/adminEmails');
const { createResponseToken, verifyResponseToken } = require('../utils/emergencyResponseToken');

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getBaseUrl = (req) => {
  const configuredBaseUrl = process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || process.env.CLIENT_URL;
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, '');
  }

  return `${req.protocol}://${req.get('host')}`;
};

const buildEmergencyEmailHtml = ({ donor, bloodGroup, subject, message, donateUrl }) => `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f9fafb;padding:20px">
    <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:linear-gradient(135deg,#b91c1c,#dc2626);color:#ffffff;padding:20px 24px">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.8">Emergency Notification</p>
        <h2 style="margin:0;font-size:28px">${escapeHtml(subject)}</h2>
      </div>

      <div style="padding:24px;color:#1f2937">
        <p style="margin-top:0"><strong>Dear ${escapeHtml(donor.name || 'Donor')},</strong></p>
        <p>
          There is an urgent requirement for <strong style="color:#b91c1c">${escapeHtml(bloodGroup)}</strong> blood.
          If you are available to help, please confirm using the button below.
        </p>

        <div style="margin:18px 0;padding:16px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;white-space:pre-line">
          ${escapeHtml(message)}
        </div>

        <a
          href="${donateUrl}"
          style="display:inline-block;margin-top:8px;background:#dc2626;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:999px;font-weight:700"
        >
          I Can Donate
        </a>

        <p style="margin-top:18px;font-size:14px;color:#475569">
          Once you confirm, the admin team will receive your donor details immediately.
        </p>

        <p style="margin-top:24px"><strong>TCE NSS Blood Donation Team</strong></p>
      </div>

      <div style="background:#f8fafc;padding:12px 24px;font-size:12px;color:#64748b;text-align:center">
        &copy; ${new Date().getFullYear()} TCE NSS Blood Donation Management System
      </div>
    </div>
  </div>
`;

const buildResponseHtml = ({ title, description, tone = 'success' }) => {
  const accent = tone === 'success' ? '#16a34a' : '#dc2626';

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#f8fafc;color:#0f172a">
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">
        <div style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;padding:32px;box-shadow:0 18px 50px rgba(15,23,42,0.08)">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:${accent};font-weight:700">Emergency Alert</p>
          <h1 style="margin:0 0 14px;font-size:28px">${escapeHtml(title)}</h1>
          <p style="margin:0;font-size:16px;line-height:1.6;color:#475569">${escapeHtml(description)}</p>
        </div>
      </div>
    </body>
  </html>`;
};

const sendEmergencyEmail = asyncHandler(async (req, res) => {
  const { bloodGroup, subject, message } = req.body;

  const donors = await Donor.find({ bloodGroup }).sort({ createdAt: -1 });

  if (donors.length === 0) {
    return res.status(404).json({ message: 'No donors found for this blood group' });
  }

  const transporter = createTransporter();
  const sender = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER;
  const safeSubject = subject || 'Urgent Blood Requirement';
  const safeMessage = message || 'Please contact the NSS team immediately if you are available to donate.';
  const baseUrl = getBaseUrl(req);

  await transporter.verify();

  const alert = await EmergencyAlert.create({
    bloodGroup,
    subject: safeSubject,
    message: safeMessage,
    recipientCount: donors.length,
    createdByName: req.userDb?.name || req.user?.email || 'Admin',
    createdByEmail: req.user?.email || req.userDb?.email || ''
  });

  try {
    for (const donor of donors) {
      const donorEmail = donor.email?.trim().toLowerCase();
      if (!donorEmail) continue;

      const token = createResponseToken({ alertId: String(alert._id), donorId: String(donor._id) });
      const donateUrl = `${baseUrl}/api/email/emergency/respond?alertId=${alert._id}&donorId=${donor._id}&token=${token}`;

      await transporter.sendMail({
        from: sender,
        to: donorEmail,
        replyTo: sender,
        subject: safeSubject,
        html: buildEmergencyEmailHtml({
          donor,
          bloodGroup,
          subject: safeSubject,
          message: safeMessage,
          donateUrl
        })
      });
    }
  } catch (err) {
    await EmergencyAlert.findByIdAndDelete(alert._id);
    err.statusCode = 500;
    err.message = `Emergency email failed: ${err.message}`;
    throw err;
  }

  return res.json({
    message: `Emergency notification sent to ${donors.length} donors`,
    alertId: alert._id
  });
});

const getEmergencyAlerts = asyncHandler(async (_req, res) => {
  const alerts = await EmergencyAlert.find({}).sort({ createdAt: -1 }).limit(20);
  return res.json(alerts);
});

const acceptEmergencyResponse = asyncHandler(async (req, res) => {
  const { alertId, donorId, token } = req.query;

  if (!alertId || !donorId || !token) {
    return res
      .status(400)
      .send(buildResponseHtml({ title: 'Invalid link', description: 'This response link is incomplete or invalid.', tone: 'error' }));
  }

  const isValid = verifyResponseToken({ alertId, donorId, token });
  if (!isValid) {
    return res
      .status(403)
      .send(buildResponseHtml({ title: 'Invalid link', description: 'This donate link could not be verified.', tone: 'error' }));
  }

  const [alert, donor] = await Promise.all([EmergencyAlert.findById(alertId), Donor.findById(donorId)]);

  if (!alert || !donor) {
    return res
      .status(404)
      .send(buildResponseHtml({ title: 'Not found', description: 'The emergency alert or donor record no longer exists.', tone: 'error' }));
  }

  const alreadyAccepted = alert.responses.some((response) => String(response.donor) === String(donor._id));
  if (alreadyAccepted) {
    return res.send(
      buildResponseHtml({
        title: 'Response already received',
        description: 'Your donation availability has already been shared with the admin team. Thank you for responding.'
      })
    );
  }

  alert.responses.push({
    donor: donor._id,
    donorName: donor.name,
    donorEmail: donor.email,
    donorPhone: donor.phone,
    donorLocation: donor.location,
    acceptedAt: new Date()
  });

  await alert.save();

  const transporter = createTransporter();
  const sender = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER;
  const adminRecipients = [...new Set([...getAdminEmails(), alert.createdByEmail].filter(Boolean))];

  if (adminRecipients.length) {
    await transporter.sendMail({
      from: sender,
      to: adminRecipients.join(', '),
      subject: `Donor accepted: ${donor.name} for ${alert.bloodGroup} emergency`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:20px">
          <div style="max-width:640px;margin:auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:24px">
            <p style="margin-top:0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#dc2626;font-weight:700">Donor Response</p>
            <h2 style="margin:0 0 16px">A donor accepted the emergency request</h2>
            <p><strong>Name:</strong> ${escapeHtml(donor.name)}</p>
            <p><strong>Blood Group:</strong> ${escapeHtml(donor.bloodGroup)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(donor.phone)}</p>
            <p><strong>Email:</strong> ${escapeHtml(donor.email)}</p>
            <p><strong>Location:</strong> ${escapeHtml(donor.location)}</p>
            <p><strong>Accepted at:</strong> ${escapeHtml(new Date().toLocaleString())}</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0" />
            <p style="white-space:pre-line"><strong>Original message:</strong><br />${escapeHtml(alert.message)}</p>
          </div>
        </div>
      `
    });
  }

  return res.send(
    buildResponseHtml({
      title: 'Thank you for responding',
      description: 'Your availability has been sent to the admin team. They can contact you using the donor details in the system.'
    })
  );
});

module.exports = { sendEmergencyEmail, getEmergencyAlerts, acceptEmergencyResponse };
