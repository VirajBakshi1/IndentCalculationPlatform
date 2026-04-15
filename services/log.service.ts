import { db } from "@/lib/db";

type LogStatus = "SUCCESS" | "FAILED";

interface LogEntry {
  userId?: string;
  userEmail?: string;
  filename: string;
  status: LogStatus;
  totalWeightKg?: number;
  sectionCount?: number;
  plateCount?: number;
  totalMembers?: number;
  errorMsg?: string;
  processingMs?: number;
}

export async function createLog(entry: LogEntry) {
  try {
    await db.processingLog.create({ data: entry });
  } catch {
    // Never let logging failure break the main flow
    console.error("[log.service] Failed to write log:", entry.filename);
  }
}

export async function getLogs(opts: { page?: number; limit?: number; status?: "SUCCESS" | "FAILED" } = {}) {
  const { page = 1, limit = 100, status } = opts;
  const skip = (page - 1) * limit;
  return db.processingLog.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    skip,
    select: {
      id: true,
      userEmail: true,
      filename: true,
      status: true,
      totalWeightKg: true,
      sectionCount: true,
      plateCount: true,
      totalMembers: true,
      errorMsg: true,
      processingMs: true,
      createdAt: true,
    },
  });
}

export async function getLogStats() {
  const [total, success, failed] = await Promise.all([
    db.processingLog.count(),
    db.processingLog.count({ where: { status: "SUCCESS" } }),
    db.processingLog.count({ where: { status: "FAILED" } }),
  ]);
  return { total, success, failed };
}
