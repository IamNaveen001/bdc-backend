const Donor = require('../models/Donor');
const asyncHandler = require('../middleware/asyncHandler');
const createTransporter = require('../utils/mailer');

const sendEmergencyEmail = asyncHandler(async (req, res) => {
  const { bloodGroup, subject, message } = req.body;

  const donors = await Donor.find({ bloodGroup });
  const emails = donors.map((d) => d.email).filter(Boolean);

  if (emails.length === 0) {
    return res.status(404).json({ message: 'No donors found for this blood group' });
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.SMTP_TO || process.env.SMTP_USER,
    bcc: emails,
    subject: subject || '🚨 Urgent Blood Requirement',

    // 🔥 HTML EMAIL (THIS IS THE MAGIC)
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f9fafb;padding:20px">
        <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden">

          <!-- HEADER -->
          <div style="background:#dc2626;color:#ffffff;padding:16px;text-align:center">
            <img 
              src="https://cdn.dribbble.com/userupload/26255768/file/original-de01cccd8c317f5acaea9f43e9b3c71f.png"
              alt="Blood Donation"
              height="50"
              style="margin-bottom:10px"
            />
            <h2 style="margin:0">🚨 Blood Donation Emergency</h2>
          </div>

          <!-- BODY -->
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

            <p>
              Your contribution can save lives. Kindly respond as soon as possible.
            </p>

            <p style="margin-top:20px">
              ❤️ <strong>TCE NSS Blood Donation Team</strong>
            </p>
          </div>

          <!-- FOOTER -->
          <div style="background:#f3f4f6;padding:12px;text-align:center;font-size:12px;color:#6b7280">
            © ${new Date().getFullYear()} TCE NSS · Blood Donation Management System
          </div>

        </div>
      </div>
    `
  });

  return res.json({ message: `Email sent to ${emails.length} donors` });
});

module.exports = { sendEmergencyEmail };
