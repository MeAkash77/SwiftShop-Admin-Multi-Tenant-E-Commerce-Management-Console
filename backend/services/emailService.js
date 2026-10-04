import { transporter } from "../configs/mail.js";
import {
  otpEmailHtml,
  passwordResetEmailHtml,
  orderConfirmationEmailHtml,
  paymentReceiptEmailHtml,
} from "./emailTemplates.js";

const FROM = () => `"MultiCommerce" <${process.env.EMAIL_USER}>`;

export const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: FROM(),
    to,
    subject,
    html,
  });
};

export const sendOTP = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: "MultiCommerce — Verify your email",
    html: otpEmailHtml(otp),
  });
};

export const sendPasswordReset = async ({ to, portalLabel, resetUrl }) => {
  if (!to) return;
  await sendEmail({
    to,
    subject: `${portalLabel} password reset — MultiCommerce`,
    html: passwordResetEmailHtml({ portalLabel, resetUrl }),
  });
};

export const sendOrderConfirmation = async ({
  to,
  firstName,
  orderNumber,
  totalAmount,
  paymentMethod,
  paymentStatus,
  orderStatus,
}) => {
  if (!to) return;

  await sendEmail({
    to,
    subject: `MultiCommerce — Order ${orderNumber} confirmed`,
    html: orderConfirmationEmailHtml({
      firstName,
      orderNumber,
      totalAmount,
      paymentMethod,
      paymentStatus,
      orderStatus,
    }),
  });
};

export const sendPaymentReceipt = async ({
  to,
  firstName,
  orderNumber,
  totalAmount,
  paymentId,
}) => {
  if (!to) return;

  await sendEmail({
    to,
    subject: `MultiCommerce — Payment received for ${orderNumber}`,
    html: paymentReceiptEmailHtml({
      firstName,
      orderNumber,
      totalAmount,
      paymentId,
    }),
  });
};
