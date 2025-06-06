// server/utils/emailService.js
const nodemailer = require("nodemailer");

let transporter;

// Setup nodemailer
if (process.env.NODE_ENV === "production") {
  // Production email setup
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
} else {
  // Development email setup (using ethereal.email)
  nodemailer.createTestAccount((err, account) => {
    if (err) {
      console.error("Failed to create test email account", err);
      return;
    }

    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass,
      },
    });
  });
}

// Send invitation email
exports.sendInvitation = async (email, inviteUrl) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "ledger@example.com",
      to: email,
      subject: "Invitation to Join Ledger App",
      html: `
        <h1>You've been invited to join Ledger App</h1>
        <p>An admin has invited you to join the Financial Ledger tracking system.</p>
        <p>Please click the link below to complete your registration:</p>
        <a href="${inviteUrl}" style="display:inline-block;padding:10px 20px;background-color:#f00;color:#fff;text-decoration:none;border-radius:5px;">Complete Registration</a>
        <p>This invitation link will expire in 48 hours.</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Invitation email sent:", info.messageId);

    if (process.env.NODE_ENV !== "production") {
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (err) {
    console.error("Error sending invitation email:", err);
    throw err;
  }
};

// Send ledger creation notification
exports.sendLedgerCreationNotification = async (email, ledgerName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "ledger@example.com",
      to: email,
      subject: "New Ledger Created",
      html: `
        <h1>New Ledger Created</h1>
        <p>A new ledger named "${ledgerName}" has been created for you in the Ledger App.</p>
        <p>You can now log in to view your transactions and account details.</p>
        <a href="${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/login" style="display:inline-block;padding:10px 20px;background-color:#f00;color:#fff;text-decoration:none;border-radius:5px;">Log In Now</a>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Notification email sent:", info.messageId);

    if (process.env.NODE_ENV !== "production") {
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (err) {
    console.error("Error sending notification email:", err);
    throw err;
  }
};
