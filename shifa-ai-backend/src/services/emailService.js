const { Resend } = require('resend');

const OTP_SENDER = 'Shifa AI <onboarding@resend.dev>';
let resend = null;

function getResendClient() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

async function sendOtpEmail(toEmail, code) {
  await getResendClient().emails.send({
    from: OTP_SENDER,
    to: toEmail,
    subject: 'Your Shifa AI verification code',
    text: `Your Shifa AI verification code is ${code}. This code expires in 10 minutes.`,
  });
}

module.exports = { sendOtpEmail };
