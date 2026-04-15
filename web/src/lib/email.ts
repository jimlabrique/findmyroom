import nodemailer from "nodemailer";

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
};

let cachedConfig: SmtpConfig | null | undefined;
let cachedTransporter: nodemailer.Transporter | null | undefined;

function readSmtpConfig(): SmtpConfig | null {
  if (cachedConfig !== undefined) {
    return cachedConfig;
  }

  const host = process.env.SMTP_HOST?.trim() ?? "";
  const portRaw = process.env.SMTP_PORT?.trim() ?? "";
  const user = process.env.SMTP_USER?.trim() ?? "";
  const pass = process.env.SMTP_PASS?.trim() ?? "";
  const from = process.env.SMTP_FROM?.trim() ?? "";
  const secureRaw = process.env.SMTP_SECURE?.trim().toLowerCase() ?? "";

  const port = Number.parseInt(portRaw || "587", 10);
  const secure = secureRaw === "1" || secureRaw === "true";

  if (!host || !user || !pass || !from || !Number.isFinite(port) || port <= 0) {
    cachedConfig = null;
    return cachedConfig;
  }

  cachedConfig = {
    host,
    port,
    user,
    pass,
    from,
    secure,
  };
  return cachedConfig;
}

function getTransporter() {
  if (cachedTransporter !== undefined) {
    return cachedTransporter;
  }

  const config = readSmtpConfig();
  if (!config) {
    cachedTransporter = null;
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
  return cachedTransporter;
}

export async function sendListingContactEmail({
  to,
  senderFullName,
  senderEmail,
  listingTitle,
  listingCity,
  message,
}: {
  to: string;
  senderFullName: string;
  senderEmail: string;
  listingTitle: string;
  listingCity: string;
  message: string;
}) {
  const config = readSmtpConfig();
  const transporter = getTransporter();
  if (!config || !transporter) {
    throw new Error("email_service_unavailable");
  }

  const subject = `Candidature colocation: ${listingTitle}`;
  const text = [
    `Annonce: ${listingTitle} (${listingCity})`,
    "",
    `Nom: ${senderFullName}`,
    `Email: ${senderEmail}`,
    "",
    "Message:",
    message,
  ].join("\n");

  await transporter.sendMail({
    from: config.from,
    to,
    replyTo: senderEmail,
    subject,
    text,
  });
}
