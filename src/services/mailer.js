// src/services/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendReservationEmail(to, subject, html) {
  await transporter.sendMail({
    from: `"No-Reply" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html
  });
}

module.exports = { sendReservationEmail };
