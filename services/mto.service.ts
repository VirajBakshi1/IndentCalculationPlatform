import { parseMTO } from "@/lib/mto-parser";
import { classifySectionsAndPlates } from "@/lib/material-classifier";
import { parseIndentTemplate, generateIndent } from "@/lib/indent-generator";
import { getAppConfig } from "./config.service";
import { createLog } from "./log.service";
import type { ProcessingResult, ProcessingStats, ProjectDetails } from "@/lib/types";

interface ProcessOptions {
  buffer: Buffer;
  filename: string;
  projectDetails: ProjectDetails;
  userId?: string;
  userEmail?: string;
}

interface ProcessSuccess {
  ok: true;
  result: ProcessingResult;
  filename: string;
  processingMs: number;
}

interface ProcessFailure {
  ok: false;
  error: string;
  processingMs: number;
}

export type ProcessOutcome = ProcessSuccess | ProcessFailure;

export async function processMTO(options: ProcessOptions): Promise<ProcessOutcome> {
  const t0 = Date.now();
  const { buffer, filename, projectDetails, userId, userEmail } = options;

  try {
    // 1. Load dynamic config from DB (with hardcoded fallback)
    const config = await getAppConfig();

    // 2. Parse MTO rows
    const mtoRows = parseMTO(buffer);

    // 3. Parse indent template (gets standard lengths + unit weights)
    const { sections: indentSections, plates: indentPlates } =
      await parseIndentTemplate();

    // 4. Classify and calculate — config injected here
    const { sections, plates } = classifySectionsAndPlates(
      mtoRows,
      indentSections,
      indentPlates,
      config
    );

    // 5. Calculate summary stats
    const totalWeight = mtoRows.reduce(
      (sum, r) => sum + (r.totalWeight || r.qty * r.weightPerPc || 0),
      0
    );
    const totalMembers = mtoRows.reduce((sum, r) => sum + r.qty, 0);
    const totalPlateArea = plates.reduce(
      (sum, p) => sum + p.totalVolume / p.thickness / 1e6,
      0
    );

    const stats: ProcessingStats = {
      totalUniqueProfiles: sections.length + plates.length,
      totalMembers,
      totalWeight,
      totalPlateArea,
    };

    // 6. Generate the output Excel
    const excelBuffer = await generateIndent(sections, plates, projectDetails);
    const excelBase64 = excelBuffer.toString("base64");

    const proj = projectDetails.projectNumber || "PROJECT";
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const outFilename = `Steel_Indent_${proj}_${dateStr}.xlsx`;

    const result: ProcessingResult = {
      stats,
      sections,
      plates,
      excelBase64,
      filename: outFilename,
    };

    const processingMs = Date.now() - t0;

    // 7. Log success
    await createLog({
      userId,
      userEmail,
      filename,
      status: "SUCCESS",
      totalWeightKg: totalWeight,
      sectionCount: sections.length,
      plateCount: plates.length,
      totalMembers,
      processingMs,
    });

    return { ok: true, result, filename: outFilename, processingMs };
  } catch (err: unknown) {
    const processingMs = Date.now() - t0;
    const errorMsg = err instanceof Error ? err.message : "Unknown error";

    await createLog({
      userId,
      userEmail,
      filename,
      status: "FAILED",
      errorMsg,
      processingMs,
    });

    return { ok: false, error: errorMsg, processingMs };
  }
}
