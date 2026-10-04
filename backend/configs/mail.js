import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

