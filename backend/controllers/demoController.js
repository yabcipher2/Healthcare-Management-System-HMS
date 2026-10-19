const DemoRequest = require("../models/DemoRequest");
const nodemailer = require("nodemailer");

const submitDemoRequest = async (req, res) => {
  try {
    const { fullName, email, phone, clinicName, message } = req.body;

    const demoRequest = await DemoRequest.create({
      fullName,
      email,
      phone,
      clinicName,
      message,
    });

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;
    const notificationEmail = process.env.DEMO_NOTIFICATION_EMAIL;

    if (smtpHost && smtpUser && smtpPass && notificationEmail) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const mailOptions = {
        from: `"Mesra Demo Requests" <${smtpFrom}>`,
        to: notificationEmail,
        replyTo: email,
        subject: `New Demo Request from ${fullName}`,
        text: `
New demo request submitted:

Full Name: ${fullName}
Email: ${email}
Phone: ${phone || "N/A"}
Clinic Name: ${clinicName || "N/A"}
Message: ${message || "N/A"}

Submitted at: ${new Date().toLocaleString()}
        `,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #2563eb; margin-bottom: 16px;">New Demo Request</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 140px;">Full Name</td>
                <td style="padding: 8px 0; color: #6b7280;">${fullName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email</td>
                <td style="padding: 8px 0; color: #6b7280;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Phone</td>
                <td style="padding: 8px 0; color: #6b7280;">${phone || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Clinic Name</td>
                <td style="padding: 8px 0; color: #6b7280;">${clinicName || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; vertical-align: top;">Message</td>
                <td style="padding: 8px 0; color: #6b7280;">${message || "N/A"}</td>
              </tr>
            </table>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">Submitted at: ${new Date().toLocaleString()}</p>
          </div>
        `,
      };

      transporter.sendMail(mailOptions).catch((err) => {
        console.error("Failed to send demo notification email:", err);
      });
    }

    res.status(201).json({
      success: true,
      message: "Demo request submitted successfully",
      data: demoRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to submit demo request",
      error: error.message,
    });
  }
};

const getDemoRequests = async (req, res) => {
  try {
    const requests = await DemoRequest.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch demo requests",
      error: error.message,
    });
  }
};

module.exports = {
  submitDemoRequest,
  getDemoRequests,
};
