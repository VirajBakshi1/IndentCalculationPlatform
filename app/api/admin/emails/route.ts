import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { AdminEmailSchema } from "@/lib/validations";

// GET /api/admin/emails — list all whitelisted admin emails
export async function GET() {
  try {
    const emails = await db.adminEmail.findMany({
      orderBy: { addedAt: "asc" },
    });
    return NextResponse.json({ emails });
  } catch {
    return NextResponse.json(
      { error: "Failed to load admin emails." },
      { status: 500 }
    );
  }
}

// POST /api/admin/emails — add an email to the admin whitelist
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const body = await req.json();
  const parsed = AdminEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const normalizedEmail = parsed.data.email.toLowerCase().trim();

  // Check if already exists
  const existing = await db.adminEmail.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return NextResponse.json(
      { error: "This email is already in the admin whitelist." },
      { status: 409 }
    );
  }

  const record = await db.adminEmail.create({
    data: { email: normalizedEmail, addedBy: (token?.email as string) ?? "admin" },
  });

  // If that user already exists, promote them to ADMIN immediately
  await db.user.updateMany({
    where: { email: normalizedEmail, role: "USER" },
    data: { role: "ADMIN" },
  });

  return NextResponse.json({ email: record }, { status: 201 });
}

// DELETE /api/admin/emails — remove an email from the whitelist
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const parsed = AdminEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const normalizedEmail = parsed.data.email.toLowerCase().trim();

  try {
    await db.adminEmail.delete({ where: { email: normalizedEmail } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Email not found in whitelist." },
      { status: 404 }
    );
  }
}
