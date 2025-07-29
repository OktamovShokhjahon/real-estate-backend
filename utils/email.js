const nodemailer = require("nodemailer");

// Use environment variables for email configuration
const emailConfig = {
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "Prokvartiru.kz@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "xqoz ahsk qfay zykn", //"z012775883Z",
  },
};

// Create transporter with better error handling
const transporter = nodemailer.createTransport(emailConfig);

async function sendEmail({ to, subject, text, html }) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || "Prokvartiru.kz@gmail.com",
      to,
      subject,
      text,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    console.error("Email sending failed:", error.message);

    // Provide helpful error message for Gmail authentication issues
    if (error.code === "EAUTH" && error.responseCode === 534) {
      throw new Error(
        "Gmail authentication failed. Please set up an App Password:\n" +
          "1. Enable 2-Factor Authentication on your Google account\n" +
          "2. Go to Google Account settings > Security > App passwords\n" +
          "3. Generate an app password for 'Mail'\n" +
          "4. Use that password in EMAIL_PASSWORD environment variable"
      );
    }

    throw error;
  }
}

module.exports = { sendEmail };
