const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const TO_EMAIL = process.env.TO_EMAIL || 'iletisim@protekteknikservis.com';

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// serve static site
app.use(express.static(path.join(__dirname)));

// simple POST /send handler
app.post('/send', async (req, res) => {
  const { name, email, phone, message } = req.body || {};

  if (!name || !message) {
    return res.status(400).json({ error: 'İsim ve mesaj alanları zorunludur.' });
  }

  // read SMTP config from env
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error('SMTP bilgileri eksik. Lütfen ortam değişkenlerini ayarlayın.');
    return res.status(500).json({ error: 'Sunucu yapılandırması eksik.' });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  const mailOptions = {
    from: `"${name}" <${smtpUser}>`,
    to: TO_EMAIL,
    subject: `Yeni iletişim talebi — ${name}`,
    text: `Yeni iletişim talebi\n\nİsim: ${name}\nE-posta: ${email || '-'}\nTelefon: ${phone || '-'}\n\nMesaj:\n${message}`,
    html: `<h3>Yeni iletişim talebi</h3>
           <p><strong>İsim:</strong> ${name}</p>
           <p><strong>E-posta:</strong> ${email || '-'}</p>
           <p><strong>Telefon:</strong> ${phone || '-'}</p>
           <p><strong>Mesaj:</strong><br>${(message || '').replace(/\n/g, '<br>')}</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Mail gönderme hatası:', err);
    return res.status(500).json({ error: 'E-posta gönderilemedi.' });
  }
});

app.listen(PORT, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});
