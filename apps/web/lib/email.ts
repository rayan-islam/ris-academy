import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@risacademy.com',
    to,
    subject,
    html,
  });
}

export async function sendOTPEmail(email: string, otp: string) {
  const html = `
    <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif">
      <div style="background:#0F2B46;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0">RI's Academy</h1>
      </div>
      <div style="padding:24px;border:1px solid #e5e7eb;border-top:0">
        <h2 style="margin:0 0 8px">Verify your email</h2>
        <p style="color:#6b7280;margin:0 0 16px">Use the code below to verify your account:</p>
        <div style="background:#f3f4f6;padding:16px;text-align:center;border-radius:8px;margin-bottom:16px">
          <span style="font-size:28px;font-weight:700;letter-spacing:4px;color:#0F2B46">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:12px;margin:0">This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: email, subject: 'Verify your email — RI\'s Academy', html });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const html = `
    <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif">
      <div style="background:#0F2B46;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0">RI's Academy</h1>
      </div>
      <div style="padding:24px;border:1px solid #e5e7eb;border-top:0">
        <h2 style="margin:0 0 8px">Reset your password</h2>
        <p style="color:#6b7280;margin:0 0 16px">Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display:inline-block;background:#0F2B46;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-bottom:16px">Reset Password</a>
        <p style="color:#6b7280;font-size:12px;margin:0">This link expires in 1 hour. If you did not request this, please ignore this email.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: email, subject: 'Reset your password — RI\'s Academy', html });
}

export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
