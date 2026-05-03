const nodemailer = require("nodemailer");

exports.sendEmail = async ({ to, subject, text, html }) => {
  try {
    let transporter;

    // If user has not replaced the placeholder, fall back to Test Mode
    const isPlaceholder = process.env.SMTP_PASS && process.env.SMTP_PASS.includes("YOUR_16_DIGIT");

    if (process.env.SMTP_HOST && process.env.SMTP_USER && !isPlaceholder) {
      // Production config
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Development config: Create a dynamic Ethereal test account
      console.log("Creating dynamic test email account...");
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const info = await transporter.sendMail({
      from: '"InventIQ System" <no-reply@inventiq.com>',
      to,
      subject,
      text,
      html,
    });

    console.log(`📧 Email sent to ${to}: ${subject}`);
    let previewUrl = null;
    if (!process.env.SMTP_HOST) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`🔗 Preview URL: ${previewUrl}`);
    }
    return { info, previewUrl };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};
