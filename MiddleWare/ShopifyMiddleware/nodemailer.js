const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const appUnistall = `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <h2 style="color: #e53935;">App Uninstalled 😔</h2>
    
    <p>Hi there,</p>
    
    <p>We're sorry to see that you have uninstalled <strong>Consulty</strong>.</p>
    
    <p>If this was a mistake or you change your mind, you can reinstall anytime. We'd love to have you back! 💙</p>
    
    <div style="margin: 20px 0; padding: 15px; background-color: #f4f4f4; border-radius: 8px;">
      <p style="margin: 0;"><strong>App:</strong> Consulty</p>
      <p style="margin: 0;"><strong>Status:</strong> Uninstalled</p>
      <p style="margin: 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
    </div>

    <p>If you faced any issues, feel free to reach out — we’d love your feedback.</p>

    <p style="margin-top: 20px;">Thanks,<br/>Consulty Team</p>
  </div>
`;

const appInstall = `
<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
  <h2 style="color: #4CAF50;">Login Successful 🎉</h2>
  
  <p>Hi there,</p>
  
  <p>You have successfully logged into <strong>Consulty</strong>.</p>
  
  <p>We're glad to have you back! 🚀</p>
  
  <div style="margin: 20px 0; padding: 15px; background-color: #f4f4f4; border-radius: 8px;">
    <p style="margin: 0;"><strong>App:</strong> Consulty</p>
    <p style="margin: 0;"><strong>Status:</strong> Login Successful</p>
    <p style="margin: 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
  </div>

  <p>If this wasn’t you, please secure your account immediately.</p>

  <p style="margin-top: 20px;">Thanks,<br/>Consulty Team</p>
</div>
`;

const smtpHost = process.env.SMTP_HOST;
const smtpPORT = process.env.SMTP_PORT;
const smtpUSER = process.env.SMTP_USER;
const smtpPASS = process.env.SMTP_PASS;
const fromEmail = process.env.SMTP_FROM_EMAIL;
console.log("________________",smtpHost, smtpPORT, smtpUSER, smtpPASS, fromEmail);

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPORT,
  secure: false,
  auth: {
    user: smtpUSER,
    pass: smtpPASS,
  },
});
const sendEmail = async ({ ownerEmail, userInstall }) => {
    console.log("Runing .......")
  try {
    const info = await transporter.sendMail({
      from: fromEmail,
      to: "rohit.sangod74@gmail.com",
      subject: "Welcome 🎉",
      html: userInstall ? appInstall : appUnistall,
    });

    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = { sendEmail };
