const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || "465");
const SMTP_USER = process.env.SMTP_USER || "orviongroupofficial@gmail.com";
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || "orviongroupofficial@gmail.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";

async function getTransporter() {
  if (!SMTP_USER || !SMTP_PASS) {
    return null;
  }

  try {
    const nodemailer = (await import("nodemailer")) as any;
    return nodemailer.default ? nodemailer.default.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    }) : nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  } catch (error) {
    console.warn("[email] Could not load nodemailer. Email sending disabled.", error);
    return null;
  }
}

export async function sendAccountCredentialsEmail({
  to,
  username,
  password,
}: {
  to: string;
  username: string;
  password: string;
}) {
  const transporter = await getTransporter();
  if (!transporter) {
    console.warn("[email] SMTP not configured, skipping account email", { to });
    return false;
  }

  const loginUrl = `${APP_URL.replace(/\/$/, "")}/login`;
  const subject = "Your ORVION CRM account credentials";
  const text = `Your ORVION CRM account has been created.

Username: ${username}
Password: ${password}

Login here: ${loginUrl}

Please keep your password safe and change it after signing in.`;
  const html = `
    <div style="font-family:system-ui, sans-serif; color:#0f172a;">
      <h1 style="font-size:1.25rem; margin-bottom:0.75rem;">Your ORVION CRM account is ready</h1>
      <p style="margin:0 0 1rem; color:#475569;">Use the credentials below to sign in:</p>
      <p style="margin:0.5rem 0;"><strong>Username:</strong> ${username}</p>
      <p style="margin:0.5rem 0;"><strong>Password:</strong> ${password}</p>
      <p style="margin:1rem 0;"><a href="${loginUrl}" style="display:inline-block;padding:0.75rem 1rem;background:#0f172a;color:#fff;border-radius:0.75rem;text-decoration:none;">Sign in to ORVION</a></p>
      <p style="margin:0; color:#475569; font-size:0.95rem;">After signing in, please update your password for security.</p>
    </div>
  `;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });

  return true;
}
