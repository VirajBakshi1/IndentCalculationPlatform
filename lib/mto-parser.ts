import * as XLSX from "xlsx";
import { MTORow } from "./types";

interface ColumnMap {
  profile: number;
  memberName: number;
  qty: number;
  grade: number;
  length: number;
  weightPerPc: number;
  totalWeight: number;
  area: number;
  phaseNo: number;
  remarks: number;
}

// Fuzzy column name matcher
function scoreColumn(header: string, patterns: RegExp[]): number {
  const h = header.toLowerCase().trim();
  for (let i = 0; i < patterns.length; i++) {
    if (patterns[i].test(h)) return patterns.length - i;
  }
  return 0;
}

function detectColumns(headers: (string | number | null)[]): ColumnMap {
  const map: Partial<ColumnMap> = {};

  const definitions: { key: keyof ColumnMap; patterns: RegExp[] }[] = [
    {
      key: "profile",
      patterns: [/^profile$/i, /^section/i, /profile/i, /section/i, /description/i],
    },
    {
      key: "memberName",
      patterns: [/member.*name/i, /member/i, /name/i, /mark/i],
    },
    {
      key: "qty",
      patterns: [/^qty$/i, /^quantity$/i, /^nos$/i, /qty/i, /quantity/i, /nos/i, /pcs/i],
    },
    {
      key: "grade",
      patterns: [/^grade$/i, /material.*grade/i, /grade/i, /spec/i, /mat/i],
    },
    {
      key: "length",
      patterns: [/length.*mm/i, /^length/i, /len.*mm/i, /length/i],
    },
    {
      key: "weightPerPc",
      patterns: [/weight.*pc/i, /wt.*pc/i, /unit.*wt/i, /kg.*per/i, /wt.*piece/i],
    },
    {
      key: "totalWeight",
      patterns: [/total.*wt/i, /total.*weight/i, /gross.*wt/i, /wt.*total/i],
    },
    {
      key: "area",
      patterns: [/area/i, /sq\.?\s*cm/i, /surface/i],
    },
    {
      key: "phaseNo",
      patterns: [/phase.*no/i, /phase/i],
    },
    {
      key: "remarks",
      patterns: [/remark/i, /note/i, /comment/i],
    },
  ];

  const scores: Record<keyof ColumnMap, number[]> = {} as Record<
    keyof ColumnMap,
    number[]
  >;

  for (const def of definitions) {
    scores[def.key] = headers.map((h) =>
      h != null ? scoreColumn(String(h), def.patterns) : 0
    );
  }

  // Assign columns greedily by best score (no duplicate assignments)
  const assigned = new Set<number>();

  // Sort definitions by max score desc for priority
  const orderedDefs = definitions.slice().sort((a, b) => {
    const maxA = Math.max(...scores[a.key]);
    const maxB = Math.max(...scores[b.key]);
    return maxB - maxA;
  });

  for (const def of orderedDefs) {
    let bestIdx = -1;
    let bestScore = 0;
    scores[def.key].forEach((score, idx) => {
      if (!assigned.has(idx) && score > bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    });
    if (bestIdx >= 0 && bestScore > 0) {
      map[def.key] = bestIdx;
      assigned.add(bestIdx);
    }
  }

  // Validate required columns
  if (map.profile === undefined)
    throw new Error(
      "Cannot detect 'Profile' column in MTO file. Please ensure the file has a column named Profile or Section."
    );
  if (map.qty === undefined)
    throw new Error(
      "Cannot detect 'Quantity' column in MTO file. Please ensure the file has a column named Qty or Quantity."
    );
  if (map.length === undefined)
    throw new Error(
      "Cannot detect 'Length' column in MTO file. Please ensure the file has a column named Length(mm)."
    );

  return map as ColumnMap;
}

function toNumber(val: unknown): number {
  if (val == null) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function toString(val: unknown): string {
  if (val == null) return "";
  return String(val).trim();
}

// Classify a profile string
function classifyProfile(profile: string): "section" | "plate" | "unknown" {
  if (!profile || profile.trim() === "") return "unknown";

  const p = profile.toUpperCase().trim();

  // Plates: PL, PLT, PLATE, CHKR, CHQ, and patterns like PL10*250
  if (
    /^PL\d/.test(p) || // PL6*197
    /^PLT/.test(p) ||
    /^PLATE/.test(p) ||
    /^CHKR/.test(p) ||
    /^CHQ/.test(p) ||
    /^MS PL/.test(p) ||
    /^CHEQUERED/.test(p)
  ) {
    return "plate";
  }

  // HR Sections
  const sectionPrefixes = [
    "ISA", "ISMB", "ISMC", "ISHB", "ISB", "ISJB", "ISLB", "ISWB",
    "NPB", "UB", "UC", "TS", "RHS", "SHS", "CHS", "ERW",
    "HEA", "HEB", "IPE", "HEM", "IPN", "IPE",
  ];
  if (sectionPrefixes.some((pfx) => p.startsWith(pfx))) {
    return "section";
  }

  // Plate girders, gratings, and other fabricated items → unknown
  return "unknown";
}

export function parseMTO(buffer: Buffer): MTORow[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rawData = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: null,
    blankrows: false,
  });

  if (!rawData || rawData.length === 0) {
    throw new Error("MTO file appears to be empty or unreadable.");
  }

  // Find header row: the row that has the most recognizable column names
  let headerRowIdx = -1;
  let colMap: ColumnMap | null = null;
  const headerKeywords = [
    /profile/i, /section/i, /qty/i, /quantity/i, /length/i,
    /grade/i, /weight/i, /member/i,
  ];

  for (let i = 0; i < Math.min(rawData.length, 20); i++) {
    const row = rawData[i];
    const matchCount = row.filter(
      (cell) =>
        cell != null &&
        headerKeywords.some((kw) => kw.test(String(cell)))
    ).length;
    if (matchCount >= 3) {
      try {
        colMap = detectColumns(row);
        headerRowIdx = i;
        break;
      } catch {
        // Try next row
      }
    }
  }

  if (headerRowIdx === -1 || !colMap) {
    throw new Error(
      "Cannot find header row in MTO file. Expected columns: Profile, Qty, Length(mm), Grade."
    );
  }

  const rows: MTORow[] = [];

  for (let i = headerRowIdx + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.every((c) => c == null || c === "")) continue;

    const profile = toString(row[colMap.profile]);
    if (!profile || profile.length < 2) continue;

    // Skip subtotal / header rows within data
    const lowerProfile = profile.toLowerCase();
    if (
      lowerProfile.includes("total") ||
      lowerProfile.includes("sub total") ||
      lowerProfile.includes("grand") ||
      lowerProfile === "profile" ||
      lowerProfile === "section"
    )
      continue;

    const qty = toNumber(row[colMap.qty]);
    const length = toNumber(row[colMap.length]);

    // Skip rows with zero qty or zero length
    if (qty === 0 && length === 0) continue;

    rows.push({
      profile,
      memberName: colMap.memberName != null ? toString(row[colMap.memberName]) : "",
      qty: qty || 1,
      grade: colMap.grade != null ? toString(row[colMap.grade]) : "E250",
      length: length,
      weightPerPc: colMap.weightPerPc != null ? toNumber(row[colMap.weightPerPc]) : 0,
      totalWeight: colMap.totalWeight != null ? toNumber(row[colMap.totalWeight]) : 0,
      area: colMap.area != null ? toNumber(row[colMap.area]) : 0,
      phaseNo: colMap.phaseNo != null ? toString(row[colMap.phaseNo]) : "",
      remarks: colMap.remarks != null ? toString(row[colMap.remarks]) : "",
      rowType: classifyProfile(profile),
      rawRow: i + 1,
    });
  }

  if (rows.length === 0) {
    throw new Error(
      "No valid data rows found in MTO file after row " +
        (headerRowIdx + 1) +
        "."
    );
  }

  return rows;
}
