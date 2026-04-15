export interface ProjectDetails {
  projectNumber: string;
  date: string;
  phaseNumber: string;
  sapNumber: string;
}

export interface MTORow {
  profile: string;
  memberName: string;
  qty: number;
  grade: string;
  length: number; // mm
  weightPerPc: number; // kg
  totalWeight: number; // kg
  area: number; // sq cm
  phaseNo: string;
  remarks: string;
  rowType: "section" | "plate" | "unknown";
  rawRow: number; // source row index for debugging
}

export interface SectionGroup {
  profile: string;
  normalizedProfile: string;
  grade: string;
  standardLength: number; // mm
  totalLength: number; // mm - from MTO
  requiredPieces: number;
  unitWeight: number; // kg/m
  totalWeight: number; // MT
}

export interface PlateGroup {
  thickness: number; // mm
  grade: string;
  totalVolume: number; // mm³
  standardWidth: number; // mm
  standardLength: number; // mm — actual ordered length (may be < 12000 for small quantities)
  requiredPlates: number;
  totalWeight: number; // MT
}

export interface ProcessingStats {
  totalUniqueProfiles: number;
  totalMembers: number; // sum of all qty
  totalWeight: number; // kg
  totalPlateArea: number; // sq m
}

export interface ProcessingResult {
  stats: ProcessingStats;
  sections: SectionGroup[];
  plates: PlateGroup[];
  excelBase64: string;
  filename: string;
}

// Indent template row structure (parsed from Excel)
export interface IndentSectionRow {
  rowNum: number;
  standardLength: number; // mm (col A)
  unitWeight: number; // kg/m (col B)
  qtyInNos: number; // col C
  grade: string; // col D
  material: string; // col E (profile name)
  qtyInMT: number; // col F
}

export interface IndentPlateRow {
  rowNum: number;
  length: number; // mm (col A)
  width: number; // mm (col B)
  qtyInNos: number; // col C
  grade: string; // col D
  thickness: number; // mm (col E)
  qtyInMT: number; // col F
}
