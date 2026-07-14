import crypto from "crypto";

const ALGO = "aes-256-gcm";
const SECRET = process.env.DIALER_SECRET || "";

if (!SECRET) {
  console.warn("DIALER_SECRET not set — Dialer keys will be stored unhashed in DB (not recommended for production)");
}

export function encrypt(text: string) {
  if (!SECRET) return text;
  const iv = crypto.randomBytes(12);
  const key = crypto.createHash("sha256").update(String(SECRET)).digest();
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decrypt(enc: string) {
  if (!SECRET) return enc;
  try {
    const data = Buffer.from(enc, "base64");
    const iv = data.slice(0, 12);
    const tag = data.slice(12, 28);
    const encrypted = data.slice(28);
    const key = crypto.createHash("sha256").update(String(SECRET)).digest();
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return out.toString("utf8");
  } catch (e) {
    console.error("decrypt error", e);
    return "";
  }
}
