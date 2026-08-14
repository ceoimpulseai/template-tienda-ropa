import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

function createTransporter(): Promise<nodemailer.Transporter> {
  if (env.SMTP_HOST) {
    return Promise.resolve(
      nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT ?? 587,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
      }),
    );
  }

  // ponytail: sin SMTP configurado, manda a una cuenta Ethereal descartable
  // (gratis, sin signup) — sirve para probar el flujo en dev, no entrega mails reales.
  return nodemailer.createTestAccount().then((account) =>
    nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    }),
  );
}

function getTransporter(): Promise<nodemailer.Transporter> {
  if (!transporterPromise) transporterPromise = createTransporter();
  return transporterPromise;
}

export async function sendEmail(input: { to: string; subject: string; html: string }): Promise<void> {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({ from: env.SMTP_FROM, ...input });
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) console.log(`[email] preview (Ethereal, no SMTP configurado): ${previewUrl}`);
}
