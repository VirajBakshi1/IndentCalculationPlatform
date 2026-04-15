import { NextRequest, NextResponse } from "next/server";
import { getLogs, getLogStats } from "@/services/log.service";

// GET /api/admin/logs?page=1&limit=20&status=SUCCESS
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const status = searchParams.get("status") as "SUCCESS" | "FAILED" | null;

  try {
    const [logs, stats] = await Promise.all([
      getLogs({ page, limit, status: status ?? undefined }),
      getLogStats(),
    ]);

    return NextResponse.json({ logs, stats, page, limit });
  } catch {
    return NextResponse.json(
      { error: "Failed to load logs." },
      { status: 500 }
    );
  }
}
