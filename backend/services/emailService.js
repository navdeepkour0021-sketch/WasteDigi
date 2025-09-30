import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // false for 587 (TLS), true for 465 (SSL)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendTwoFactorCode = async (email, code, type = 'login') => {
  try {
    const transporter = createTransporter();

    const subjects = {
      login: 'WasteWise - Login Verification Code',
      enable_2fa: 'WasteWise - Enable Two-Factor Authentication',
      disable_2fa: 'WasteWise - Disable Two-Factor Authentication'
    };

    const messages = {
      login: 'Your login verification code is:',
      enable_2fa: 'Your code to enable two-factor authentication is:',
      disable_2fa: 'Your code to disable two-factor authentication is:'
    };

    const mailOptions = {
      from: `"WasteWise" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subjects[type],
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #16a34a, #059669); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">WasteWise</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #374151; margin-bottom: 20px;">Verification Code</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.5;">
              ${messages[type]}
            </p>
            <div style="background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #16a34a; letter-spacing: 4px;">${code}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
            </p>
          </div>
          <div style="background: #374151; padding: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2025 WasteWise. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ 2FA code sent to ${email}`);
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send verification email');
  }
};
