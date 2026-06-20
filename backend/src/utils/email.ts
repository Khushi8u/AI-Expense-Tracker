import nodemailer from 'nodemailer';
import { logger } from './logger';

// Create transporter lazily so missing credentials don't crash on startup
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
}

function isEmailConfigured(): boolean {
  return !!(
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    !process.env.SMTP_USER.includes('your-email') &&
    !process.env.SMTP_PASS.includes('your-app-password')
  );
}

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  if (!isEmailConfigured()) {
    // In development, log the reset URL so you can test without email
    logger.warn('⚠️  Email not configured. Reset URL (dev only):');
    logger.warn(`🔗 ${resetUrl}`);
    logger.warn('To enable real emails: set SMTP_USER and SMTP_PASS in backend/.env');
    return; // Don't throw — silently succeed so the API still returns 200
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: `"EcoSpend AI" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: '🔐 Reset Your EcoSpend AI Password',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
</head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(124,58,237,0.3);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:40px;text-align:center;">
              <div style="font-size:32px;margin-bottom:8px;">💰</div>
              <h1 style="color:white;margin:0;font-size:24px;font-weight:bold;">EcoSpend AI</h1>
              <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:13px;">Smart Finance · Greener Planet</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:white;margin:0 0 16px;font-size:22px;">Reset Your Password</h2>
              <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;line-height:1.6;font-size:15px;">
                We received a request to reset the password for your EcoSpend AI account.
                Click the button below to create a new password.
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">
                  🔐 Reset My Password
                </a>
              </div>

              <!-- Security note -->
              <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.2);border-radius:10px;padding:16px;margin:24px 0;">
                <p style="color:rgba(255,255,255,0.5);margin:0;font-size:13px;line-height:1.6;">
                  ⏱️ This link expires in <strong style="color:rgba(255,255,255,0.8);">1 hour</strong>.<br>
                  🔒 If you didn't request this, you can safely ignore this email.<br>
                  🚫 Never share this link with anyone.
                </p>
              </div>

              <!-- Fallback URL -->
              <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:16px 0 0;word-break:break-all;">
                If the button doesn't work, paste this link in your browser:<br>
                <a href="${resetUrl}" style="color:#7c3aed;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:rgba(0,0,0,0.3);padding:20px 40px;text-align:center;">
              <p style="color:rgba(255,255,255,0.2);font-size:12px;margin:0;">
                © ${new Date().getFullYear()} EcoSpend AI · SDG 12 · SDG 13 · SDG 11<br>
                IBM SkillsBuild × 1M1B AI for Sustainability Internship
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Password reset email sent to ${email} (messageId: ${info.messageId})`);
  } catch (error: any) {
    logger.error('❌ Failed to send reset email:', error.message);
    throw new Error('Failed to send email. Check SMTP settings.');
  }
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  if (!isEmailConfigured()) {
    logger.warn(`⚠️  Welcome email skipped (SMTP not configured) for ${email}`);
    return;
  }

  const transporter = createTransporter();

  try {
    await transporter.sendMail({
      from: `"EcoSpend AI" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: '🌱 Welcome to EcoSpend AI!',
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(16,185,129,0.3);">
        <tr>
          <td style="background:linear-gradient(135deg,#059669,#0d9488);padding:40px;text-align:center;">
            <div style="font-size:32px;margin-bottom:8px;">🌱</div>
            <h1 style="color:white;margin:0;font-size:24px;">Welcome to EcoSpend AI!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="color:white;margin:0 0 16px;">Hey ${name}! 🎉</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;line-height:1.6;">
              Your account is ready. Start tracking expenses, earning eco badges, and growing your virtual tree!
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard"
                 style="display:inline-block;background:linear-gradient(135deg,#059669,#0d9488);color:white;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">
                🚀 Go to Dashboard
              </a>
            </div>
            <p style="color:rgba(255,255,255,0.3);font-size:13px;text-align:center;">
              SDG 12 · SDG 13 · SDG 11 · IBM SkillsBuild
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
      `,
    });
    logger.info(`✅ Welcome email sent to ${email}`);
  } catch (error: any) {
    logger.warn(`Welcome email failed for ${email}:`, error.message);
  }
};
