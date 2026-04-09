const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const smtpHost = process.env.SMTP_HOST;
const smtpPORT = process.env.SMTP_PORT;
const smtpUSER = process.env.SMTP_USER;
const smtpPASS = process.env.SMTP_PASS;
const fromEmail = process.env.SMTP_FROM_EMAIL;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPORT,
  secure: false,
  auth: {
    user: smtpUSER,
    pass: smtpPASS,
  },
});
const sendEmail = async (ownerEmail) => {
  try {
    const info = await transporter.sendMail({
      from: fromEmail,
      to: ownerEmail,
      subject: "Welcome 🎉",
      html: `
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
    `,
    });

    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = { sendEmail };
