import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { processMTO } from "@/services/mto.service";
import { ProjectDetailsSchema } from "@/lib/validations";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Get user info from token (middleware already verified auth)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  try {
    const formData = await req.formData();
    const file = formData.get("mto") as File | null;
    const projectDetailsRaw = formData.get("projectDetails") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No MTO file provided." },
        { status: 400 }
      );
    }

    // Validate file type
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext || "")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload .xlsx, .xls, or .csv files only." },
        { status: 400 }
      );
    }

    // Validate project details
    const rawDetails = projectDetailsRaw ? JSON.parse(projectDetailsRaw) : {};
    const parsed = ProjectDetailsSchema.safeParse(rawDetails);
    const projectDetails = parsed.success
      ? parsed.data
      : { projectNumber: "", date: "", phaseNumber: "", sapNumber: "" };

    const buffer = Buffer.from(await file.arrayBuffer());

    const outcome = await processMTO({
      buffer,
      filename: file.name,
      projectDetails,
      userId: token?.sub,
      userEmail: token?.email as string | undefined,
    });

    if (!outcome.ok) {
      return NextResponse.json({ error: outcome.error }, { status: 422 });
    }

    return NextResponse.json(outcome.result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("[process-mto] Error:", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
