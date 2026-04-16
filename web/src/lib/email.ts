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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toHtmlParagraphs(value: string) {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

function resolvePublicSiteUrl() {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.findmyroom.be";
  try {
    const url = new URL(candidate);
    const hostname = url.hostname.toLowerCase();
    const isLocalLike =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.endsWith(".local");
    if (isLocalLike) {
      return "https://www.findmyroom.be";
    }
    return url.origin.replace(/\/+$/, "");
  } catch {
    return "https://www.findmyroom.be";
  }
}

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
  listingSlug,
  listingPhotoUrl,
  message,
}: {
  to: string;
  senderFullName: string;
  senderEmail: string;
  listingTitle: string;
  listingCity: string;
  listingSlug?: string | null;
  listingPhotoUrl?: string | null;
  message: string;
}) {
  const config = readSmtpConfig();
  const transporter = getTransporter();
  if (!config || !transporter) {
    throw new Error("email_service_unavailable");
  }

  const subject = `Nouveau message candidat: ${listingTitle}`;
  const siteUrl = resolvePublicSiteUrl();
  const listingUrl = listingSlug ? `${siteUrl}/annonces/${encodeURIComponent(listingSlug)}` : null;
  const replyToHref = `mailto:${encodeURIComponent(senderEmail)}?subject=${encodeURIComponent(`Re: ${listingTitle}`)}`;
  const safeSenderFullName = escapeHtml(senderFullName);
  const safeSenderEmail = escapeHtml(senderEmail);
  const safeListingTitle = escapeHtml(listingTitle);
  const safeListingCity = escapeHtml(listingCity);
  const safeMessageHtml = toHtmlParagraphs(message);
  const safeListingPhotoUrl =
    typeof listingPhotoUrl === "string" && listingPhotoUrl.trim().length > 0 ? escapeHtml(listingPhotoUrl.trim()) : null;

  const text = [
    "FindMyRoom - Nouveau message candidat",
    "",
    `Annonce: ${listingTitle} (${listingCity})`,
    listingUrl ? `Lien annonce: ${listingUrl}` : "",
    safeListingPhotoUrl ? `Photo annonce: ${safeListingPhotoUrl}` : "",
    "",
    `Nom: ${senderFullName}`,
    `Email: ${senderEmail}`,
    "",
    "Message:",
    message,
  ].join("\n");

  const html = `
<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#f7f3eb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e7e0d4;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 6px 32px;">
                <img
                  src="${siteUrl}/findmyrooom-logo.png"
                  alt="FindMyRoom"
                  width="220"
                  style="display:block;max-width:220px;height:auto;"
                />
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0 32px;">
                <p style="margin:0 0 10px 0;font-size:12px;line-height:1;letter-spacing:1.5px;text-transform:uppercase;color:#9a8f84;font-weight:700;">
                  Nouveau contact annonce
                </p>
                <h1 style="margin:0 0 16px 0;font-size:36px;line-height:1.1;color:#1f2937;font-weight:800;">
                  ${safeListingTitle}
                </h1>
                <p style="margin:0;font-size:18px;line-height:1.5;color:#49433c;">
                  ${safeListingCity}
                </p>
              </td>
            </tr>
            ${
              safeListingPhotoUrl
                ? `<tr>
              <td style="padding:20px 32px 0 32px;">
                <img
                  src="${safeListingPhotoUrl}"
                  alt="${safeListingTitle}"
                  width="576"
                  style="display:block;width:100%;max-width:576px;height:auto;aspect-ratio:16/9;object-fit:cover;border-radius:14px;border:1px solid #efe5de;background:#f4f4f5;"
                />
              </td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding:24px 32px 0 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #efe5de;border-radius:12px;background:#fcfaf8;">
                  <tr>
                    <td style="padding:14px 16px;">
                      <p style="margin:0 0 6px 0;font-size:13px;color:#8b847b;">Candidat</p>
                      <p style="margin:0;font-size:16px;line-height:1.5;color:#1f2937;"><strong>${safeSenderFullName}</strong></p>
                      <p style="margin:2px 0 0 0;font-size:14px;line-height:1.5;color:#57534e;">${safeSenderEmail}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0 32px;">
                <p style="margin:0 0 10px 0;font-size:14px;line-height:1.5;color:#8b847b;">Message</p>
                <div style="font-size:16px;line-height:1.6;color:#1f2937;">${safeMessageHtml}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0 32px;">
                <a
                  href="${replyToHref}"
                  style="display:inline-block;background:#ee7768;color:#ffffff;text-decoration:none;font-weight:700;font-size:18px;line-height:1;padding:14px 20px;border-radius:12px;"
                >
                  Répondre au candidat
                </a>
                ${
                  listingUrl
                    ? `<a
                  href="${listingUrl}"
                  style="display:inline-block;margin-left:10px;background:#fff;border:1px solid #dfd5c9;color:#5b5249;text-decoration:none;font-weight:600;font-size:16px;line-height:1;padding:14px 18px;border-radius:12px;"
                >
                  Voir l'annonce
                </a>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:22px 32px 30px 32px;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#8b847b;">
                  Ce message a été envoyé depuis le formulaire de contact de ton annonce sur FindMyRoom.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();

  await transporter.sendMail({
    from: config.from,
    to,
    replyTo: senderEmail,
    subject,
    text,
    html,
  });
}
