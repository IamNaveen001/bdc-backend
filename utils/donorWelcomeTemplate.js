module.exports = ({ name, bloodGroup }) => `
<div style="font-family:Arial,Helvetica,sans-serif;background:#f9fafb;padding:20px">
  <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden">

    <!-- HEADER -->
    <div style="background:#dc2626;color:#ffffff;padding:20px;text-align:center">
      <img 
        src="https://cdn.dribbble.com/userupload/26255768/file/original-de01cccd8c317f5acaea9f43e9b3c71f.png"
        alt="Blood Donation"
        height="50"
        style="margin-bottom:10px"
      />
      <h2 style="margin:0">🎉 Registration Successful</h2>
    </div>

    <!-- BODY -->
    <div style="padding:20px;color:#1f2937;font-size:14px;line-height:1.6">
      <p>Dear <strong>${name}</strong>,</p>

      <p>
        Thank you for registering as a blood donor with
        <strong>TCE NSS Blood Donation Program</strong>.
      </p>

      <div style="margin:16px 0;padding:14px;background:#fee2e2;border-radius:8px">
        <strong>Blood Group:</strong> ${bloodGroup}
      </div>

      <p>
        Your willingness to donate blood can save lives.
        We will contact you whenever there is an emergency need.
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
`;
