import { promises as fs } from "fs";
import path from "path";

const uploadsDir = path.join(process.cwd(), "uploads");
const logoMetaPath = path.join(uploadsDir, "logo.json");

export async function getCurrentLogo() {
  try {
    const raw = await fs.readFile(logoMetaPath, "utf-8");
    const data = JSON.parse(raw) as { logoUrl?: string };
    return data.logoUrl ?? null;
  } catch {
    return null;
  }
}

export async function saveLogoMeta(url: string) {
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(logoMetaPath, JSON.stringify({ logoUrl: url }, null, 2), "utf-8");
}
