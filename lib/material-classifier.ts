import { MTORow, SectionGroup, PlateGroup, IndentSectionRow, IndentPlateRow } from "./types";
import { AppConfig, DEFAULT_CONFIG } from "@/services/config.service";

// ── Profile name normalisation ────────────────────────────────────────────────
// Handles: ISA 65X65X6, ISA65x65x6, ISA 65*65*6, ISA65 X 65 X 6, isa65x65x6
export function normalizeSectionName(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[×*]/g, "X")
    .replace(/\s*X\s*/g, "X")
    .replace(/\s+/g, "");
}

// ── Explicit plate profile parser ─────────────────────────────────────────────
// Handles: PL6*197, PLT12*250, PL 10 * 300
export function parsePlateDimensions(profile: string): { thickness: number; width: number } | null {
  const p = profile.toUpperCase().trim().replace(/\s+/g, "");
  const m1 = p.match(/^(?:PL[T]?)(\d+(?:\.\d+)?)[*X](\d+(?:\.\d+)?)/);
  if (m1) return { thickness: parseFloat(m1[1]), width: parseFloat(m1[2]) };
  const m2 = p.match(/^(?:PL[T]?)(\d+(?:\.\d+)?)$/);
  if (m2) return { thickness: parseFloat(m2[1]), width: 0 };
  return null;
}

// ── Plate Girder parser ───────────────────────────────────────────────────────
// Format: PG{flangeW}*{flangeThk}-{webH}*{webThk}[-{botFlangeW}*{botFlangeThk}]
// Symmetric:   PG400*32-736*16           → both flanges 400×32, web 736×16
// Asymmetric:  PG400*32-736*16-350*32   → top 400×32, web 736×16, bottom 350×32
interface PGDimensions {
  topFlangeWidth: number;
  topFlangeThk: number;
  webHeight: number;
  webThk: number;
  botFlangeWidth: number;
  botFlangeThk: number;
}

function parsePGProfile(profile: string): PGDimensions | null {
  const p = profile.trim().toUpperCase().replace(/\s+/g, "");
  if (!p.startsWith("PG")) return null;

  const segments = p.slice(2).split("-");
  if (segments.length < 2) return null;

  const parsePair = (s: string): { a: number; b: number } | null => {
    const m = s.match(/^(\d+(?:\.\d+)?)\*(\d+(?:\.\d+)?)/);
    return m ? { a: parseFloat(m[1]), b: parseFloat(m[2]) } : null;
  };

  const seg0 = parsePair(segments[0]); // flange: width * thickness
  const seg1 = parsePair(segments[1]); // web:    height * thickness
  if (!seg0 || !seg1) return null;

  let botFlangeWidth = seg0.a;
  let botFlangeThk = seg0.b;

  if (segments.length >= 3) {
    const seg2 = parsePair(segments[2]);
    if (seg2) { botFlangeWidth = seg2.a; botFlangeThk = seg2.b; }
  }

  return {
    topFlangeWidth: seg0.a,
    topFlangeThk: seg0.b,
    webHeight: seg1.a,
    webThk: seg1.b,
    botFlangeWidth,
    botFlangeThk,
  };
}

// ── Plate accumulator helper ──────────────────────────────────────────────────
function addToPlateAccum(
  map: Map<number, { grade: string; totalVolume: number }>,
  thk: number,
  grade: string,
  volume: number
) {
  const existing = map.get(thk);
  if (existing) {
    existing.totalVolume += volume;
  } else {
    map.set(thk, { grade, totalVolume: volume });
  }
}

// ── Main classifier ───────────────────────────────────────────────────────────
// Config is injected — all constants come from the database via AppConfig.
// Falls back to DEFAULT_CONFIG when config is not provided.
export function classifySectionsAndPlates(
  rows: MTORow[],
  indentSections: IndentSectionRow[],
  indentPlates: IndentPlateRow[],
  config: AppConfig = DEFAULT_CONFIG
): {
  sections: SectionGroup[];
  plates: PlateGroup[];
} {
  const sectionByProfile = new Map<string, IndentSectionRow>();
  for (const s of indentSections) {
    sectionByProfile.set(normalizeSectionName(s.material), s);
  }

  const sectionAccum = new Map<
    string,
    { profile: string; normalizedProfile: string; grade: string; totalLength: number; totalWeight: number }
  >();
  const plateAccum = new Map<number, { grade: string; totalVolume: number }>();

  const defaultSectionGrade = config.sectionDefaultGrade;
  const defaultPlateGrade = config.plateDefaultGrade;

  for (const row of rows) {
    // ── HR Sections ───────────────────────────────────────────────────────────
    if (row.rowType === "section") {
      const norm = normalizeSectionName(row.profile);
      const totalLen = row.qty * row.length;
      const totalWt = row.totalWeight || row.qty * row.weightPerPc;
      const existing = sectionAccum.get(norm);
      if (existing) {
        existing.totalLength += totalLen;
        existing.totalWeight += totalWt;
      } else {
        sectionAccum.set(norm, {
          profile: row.profile,
          normalizedProfile: norm,
          grade: row.grade || defaultSectionGrade,
          totalLength: totalLen,
          totalWeight: totalWt,
        });
      }

    // ── Explicit Plates (PL*, PLT*) ───────────────────────────────────────────
    } else if (row.rowType === "plate") {
      const dims = parsePlateDimensions(row.profile);
      if (!dims) continue;
      const { thickness: thk, width } = dims;
      const cutWidth = width > 0 ? width : row.length;
      const cutLength = row.length > 0 ? row.length : width;
      const volume = cutLength * cutWidth * thk * row.qty;
      addToPlateAccum(plateAccum, thk, row.grade || defaultPlateGrade, volume);

    // ── Plate Girders ─────────────────────────────────────────────────────────
    } else {
      const pgDims = parsePGProfile(row.profile);
      if (pgDims && row.length > 0) {
        // Each PG unit: top flange + bottom flange + web plate
        const g = row.grade || defaultPlateGrade;
        const len = row.length;
        const qty = row.qty;
        addToPlateAccum(plateAccum, pgDims.topFlangeThk, g, pgDims.topFlangeWidth * len * pgDims.topFlangeThk * qty);
        addToPlateAccum(plateAccum, pgDims.botFlangeThk, g, pgDims.botFlangeWidth * len * pgDims.botFlangeThk * qty);
        addToPlateAccum(plateAccum, pgDims.webThk,       g, pgDims.webHeight      * len * pgDims.webThk        * qty);
      }
      // Grating / misc → skipped, procured separately
    }
  }

  // ── Build Section Groups ──────────────────────────────────────────────────
  const sections: SectionGroup[] = [];
  for (const [norm, acc] of sectionAccum.entries()) {
    const indentRow = sectionByProfile.get(norm) || null;
    const standardLength = indentRow
      ? indentRow.standardLength
      : config.sectionDefaultLength;

    const requiredPieces = Math.ceil(acc.totalLength / standardLength);

    const totalWeightMT = indentRow
      ? (standardLength / 1000) * indentRow.unitWeight * requiredPieces / 1000
      : acc.totalWeight / 1000;

    sections.push({
      profile: acc.profile,
      normalizedProfile: norm,
      grade: acc.grade,
      standardLength,
      totalLength: acc.totalLength,
      requiredPieces,
      unitWeight: indentRow ? indentRow.unitWeight : 0,
      totalWeight: totalWeightMT,
    });
  }

  // ── Build Plate Groups ────────────────────────────────────────────────────
  // All constants sourced from injected config (DB-driven, with hardcoded fallback)
  const {
    plateHeavyThreshold,
    plateHeavyWidth,
    plateLightWidth,
    plateMaxLength,
    plateScrapFactor,
    steelDensity,
  } = config;

  const plates: PlateGroup[] = [];
  for (const [thk, acc] of plateAccum.entries()) {
    const standardWidth = thk >= plateHeavyThreshold ? plateHeavyWidth : plateLightWidth;
    const totalArea = acc.totalVolume / thk;             // mm² (net, no scrap)
    const standardPlateArea = plateMaxLength * standardWidth; // mm²

    let outLength: number;
    let requiredPlates: number;

    if (totalArea <= standardPlateArea) {
      // Scenario A — small order: one custom-cut plate, no scrap
      outLength = Math.ceil(totalArea / standardWidth);
      requiredPlates = 1;
    } else {
      // Scenario B — large order: full-length plates + scrap factor
      outLength = plateMaxLength;
      requiredPlates = Math.ceil((totalArea * plateScrapFactor) / standardPlateArea);
    }

    // Weight formula: L × W × thk × qty × density / 1e9 → MT
    // (density in g/cm³ = g/cm³, 1 g/cm³ = 1e-6 kg/mm³, ×1e-3 for kg→MT = 1e-9)
    const totalWeightMT = (outLength * standardWidth * thk * requiredPlates * steelDensity) / 1e9;

    plates.push({
      thickness: thk,
      grade: acc.grade,
      totalVolume: acc.totalVolume,
      standardWidth,
      standardLength: outLength,
      requiredPlates,
      totalWeight: totalWeightMT,
    });
  }

  void indentPlates; // reserved for future template matching

  return {
    sections: sections.sort((a, b) => a.normalizedProfile.localeCompare(b.normalizedProfile)),
    plates: plates.sort((a, b) => b.thickness - a.thickness),
  };
}
