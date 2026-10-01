const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendOTPEmail = async (email, otp, name) => {
  // In development without email credentials, just log the OTP
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_gmail@gmail.com') {
    console.log(`📧 [DEV MODE] OTP for ${email}: ${otp}`);
    return { success: true, devMode: true };
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: `"StudySphere" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'StudySphere - Password Reset OTP',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Arial', sans-serif; background: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
            .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
            .body { padding: 40px 30px; }
            .greeting { font-size: 18px; color: #1e293b; margin-bottom: 16px; }
            .description { color: #64748b; line-height: 1.6; margin-bottom: 32px; }
            .otp-box { background: linear-gradient(135deg, #f1f5f9, #e8eaf6); border: 2px dashed #6366f1; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
            .otp-code { font-size: 48px; font-weight: 800; color: #6366f1; letter-spacing: 12px; }
            .otp-label { color: #64748b; font-size: 13px; margin-top: 8px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #92400e; margin-top: 24px; }
            .footer { padding: 24px 30px; background: #f8fafc; text-align: center; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 StudySphere</h1>
              <p>Plan Better. Study Smarter. Achieve More.</p>
            </div>
            <div class="body">
              <p class="greeting">Hello, ${name}!</p>
              <p class="description">
                We received a request to reset your StudySphere account password. 
                Use the OTP below to complete the process. This OTP is valid for <strong>10 minutes</strong>.
              </p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <div class="otp-label">Your One-Time Password</div>
              </div>
              <div class="warning">
                ⚠️ If you didn't request this password reset, please ignore this email. Your account is safe.
              </div>
            </div>
            <div class="footer">
              <p>© 2024 StudySphere. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  return { success: true, devMode: false };
};

module.exports = { sendOTPEmail };
