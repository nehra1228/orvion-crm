import { NextResponse } from "next/server";
import { getCurrentLogo, saveLogoMeta } from "@/lib/logo";
import fs from "fs";
import path from "path";

const uploadsDir = path.join(process.cwd(), "public", "uploads");

async function storeLogo(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = `logo-${Date.now()}-${file.name}`;
  const filePath = path.join(uploadsDir, fileName);

  await fs.promises.mkdir(uploadsDir, { recursive: true });
  await fs.promises.writeFile(filePath, buffer);
  return `/uploads/${fileName}`;
}

export async function GET() {
  const logoUrl = await getCurrentLogo();
  return NextResponse.json({ logoUrl });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("logo");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ message: "No logo file provided." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ message: "File must be an image." }, { status: 400 });
  }

  try {
    const logoUrl = await storeLogo(file);
    await saveLogoMeta(logoUrl);
    return NextResponse.json({ logoUrl });
  } catch (error) {
    return NextResponse.json({ message: "Failed to store logo." }, { status: 500 });
  }
}
