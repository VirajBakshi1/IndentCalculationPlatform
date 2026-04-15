import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  updateConfig,
  resetConfigToDefault,
  getConfigHistory,
} from "@/services/config.service";
import { ConfigUpdateSchema } from "@/lib/validations";
import { db } from "@/lib/db";

// GET /api/config/[key] — single config + its history
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  try {
    const config = await db.config.findUnique({ where: { key } });
    if (!config) {
      return NextResponse.json({ error: "Config not found." }, { status: 404 });
    }
    const history = await getConfigHistory(key);
    return NextResponse.json({ config, history });
  } catch {
    return NextResponse.json({ error: "Failed to load config." }, { status: 500 });
  }
}

// PUT /api/config/[key] — update a single config value (ADMIN only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const body = await req.json();
  const parsed = ConfigUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const changedBy = (token?.email as string) ?? "admin";
  const result = await updateConfig(key, parsed.data.value, changedBy);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/config/[key] — reset config to its default value (ADMIN only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const changedBy = (token?.email as string) ?? "admin";
  const result = await resetConfigToDefault(key, changedBy);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({ success: true });
}
