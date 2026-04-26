const express = require('express');
const router = express.Router();

function getMailer() {
  try {
    return require('nodemailer');
  } catch (error) {
    return null;
  }
}

async function sendFaqAnsweredEmail({ toEmail, productName, question, answer }) {
  if (!toEmail) {
    return { sent: false, reason: 'missing-recipient' };
  }

  const nodemailer = getMailer();

  if (!nodemailer) {
    return { sent: false, reason: 'nodemailer-not-installed' };
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user || 'no-reply@buyright.local';

  let transporter;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });
  } else {
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }

  const mailInfo = await transporter.sendMail({
    from,
    to: toEmail,
    subject: 'Your FAQ question has been answered',
    text: `Your question on ${productName} has been answered.\n\nQuestion: ${question}\nAnswer: ${answer}`
  });

  return { sent: true, id: mailInfo.messageId || null };
}

router.post('/faq-answered', async (req, res) => {
  try {
    const result = await sendFaqAnsweredEmail({
      toEmail: req.body.toEmail,
      productName: req.body.productName,
      question: req.body.question,
      answer: req.body.answer
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      sent: false,
      reason: 'send-failed'
    });
  }
});

module.exports = router;
