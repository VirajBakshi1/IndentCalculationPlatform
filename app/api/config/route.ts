import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { batchUpdateConfig } from "@/services/config.service";
import { ConfigBatchUpdateSchema } from "@/lib/validations";

// GET /api/config — returns all config entries with metadata
export async function GET(req: NextRequest) {
  try {
    const configs = await db.config.findMany({ orderBy: { group: "asc" } });
    return NextResponse.json({ configs });
  } catch {
    return NextResponse.json({ error: "Failed to load configs." }, { status: 500 });
  }
}

// POST /api/config — batch update multiple configs at once (ADMIN only)
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const body = await req.json();
  const parsed = ConfigBatchUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const changedBy = (token?.email as string) ?? "admin";
  const result = await batchUpdateConfig(parsed.data.updates, changedBy);

  if (!result.success) {
    return NextResponse.json(
      { error: "Some updates failed.", errors: result.errors },
      { status: 422 }
    );
  }

  return NextResponse.json({ success: true });
}
