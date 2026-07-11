import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlLength: process.env.DATABASE_URL?.length ?? 0,
    hasJwtSecret: !!process.env.JWT_SECRET,
  });
}