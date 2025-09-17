import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Error verifying email transport:", error);
  } else {
    console.log("Email transport is ready to send messages");
  }
});

export const sendOtptoEmail = async (email, otp, userData) => {
  const profilePicture = userData.profilePicture;
  const username = userData.username || 'User';

  const html = `
  <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 24px; color: #333;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
      <tr style="background: #2563eb; color: #ffffff;">
        <td style="padding: 16px; display: flex; align-items: center;">
          <span style="font-size: 22px; font-weight: bold; margin-left: 8px; display: flex; align-items: center;">
            <img src="${profilePicture}" alt="logo" width="32" height="32" style="border-radius: 50%; margin-right: 8px;" />
            ChatSphere
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px;">
          <h2 style="margin: 0 0 16px 0; color: #111;">Hi ${username},</h2>
          <p style="margin: 0 0 16px 0;">We received a request to verify your ChatSphere account (<strong>${email}</strong>).</p>
          <p style="margin: 0 0 16px 0;">Please use the following one-time password (OTP) to complete your verification:</p>
          
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 28px; letter-spacing: 4px; padding: 12px 24px; background: #f1f5f9; color: #111; border-radius: 6px; display: inline-block; font-weight: bold;">
              ${otp}
            </span>
          </div>

          <p style="margin: 0 0 16px 0; color: #444;">
            ⚠️ This code will expire in <strong>5 minutes</strong>. Do not share it with anyone.
          </p>

          <p style="margin: 0;">If you didn’t request this code, you can safely ignore this email.</p>

          <p style="margin-top: 24px; color: #555;">Best regards,<br/>The ChatSphere Team</p>
        </td>
      </tr>
      <tr>
        <td style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #777;">
          This is an automated email from <strong>ChatSphere</strong>. Please do not reply.
        </td>
      </tr>
    </table>
  </div>
`;

  await transporter.sendMail({
    from: `ChatSphere <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Your ChatSphere Verification Code",
    html
  });
};
