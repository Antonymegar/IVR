import nodemailer from "nodemailer";

const defaultEmailData = { from: "noreply@node-react.com" };

export const sendEmail = async (emailData = defaultEmailData) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS,
    },
  });
  try {
    const info = await transporter.sendMail(emailData);
    return console.log(`Message sent: ${info.response}`);
  } catch (err) {
    return console.log(`Problem sending email: ${err}`);
  }
};
