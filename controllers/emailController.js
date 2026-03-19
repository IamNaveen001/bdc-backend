const Donor = require('../models/Donor');
const asyncHandler = require('../middleware/asyncHandler');
const createTransporter = require('../utils/mailer');

const sendEmergencyEmail = asyncHandler(async (req, res) => {
  const { bloodGroup, subject, message } = req.body;

  const donors = await Donor.find({ bloodGroup });
  const emails = [...new Set(donors.map((donor) => donor.email?.trim().toLowerCase()).filter(Boolean))];

  if (emails.length === 0) {
    return res.status(404).json({ message: 'No donors found for this blood group' });
  }

  const transporter = createTransporter();

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER,
      to: process.env.SMTP_TO || process.env.SMTP_USER || process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      bcc: emails.join(', '),
      subject: subject || 'Urgent Blood Requirement',
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;background:#f9fafb;padding:20px">
          <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden">
            <div style="background:#dc2626;color:#ffffff;padding:16px;text-align:center">
              <h2 style="margin:0">Blood Donation Emergency</h2>
            </div>

            <div style="padding:20px;color:#1f2937">
              <p><strong>Dear Donor,</strong></p>

              <p>
                There is an <strong>urgent requirement</strong> for
                <span style="color:#dc2626;font-weight:bold">${bloodGroup}</span>
                blood.
              </p>

              <div style="margin:16px 0;padding:14px;background:#fee2e2;border-radius:8px">
                ${message || 'Please contact the NSS team immediately if you are available to donate.'}
              </div>

              <p>Your contribution can save lives. Kindly respond as soon as possible.</p>

              <p style="margin-top:20px"><strong>TCE NSS Blood Donation Team</strong></p>
            </div>

            <div style="background:#f3f4f6;padding:12px;text-align:center;font-size:12px;color:#6b7280">
              &copy; ${new Date().getFullYear()} TCE NSS Blood Donation Management System
            </div>
          </div>
        </div>
      `
    });
  } catch (err) {
    err.statusCode = 500;
    err.message = `Emergency email failed: ${err.message}`;
    throw err;
  }

  return res.json({ message: `Email sent to ${emails.length} donors` });
});

module.exports = { sendEmergencyEmail };
