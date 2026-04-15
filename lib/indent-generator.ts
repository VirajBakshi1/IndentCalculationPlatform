import ExcelJS from "exceljs";
import path from "path";
import { SectionGroup, PlateGroup, ProjectDetails, IndentSectionRow, IndentPlateRow } from "./types";
import { normalizeSectionName } from "./material-classifier";

const TEMPLATE_PATH = path.join(process.cwd(), "templates", "indent_template.xlsx");

// Known indent structure constants (discovered from parsing the template XML)
// Row 1: Project header
// Row 2: Date
// Row 3: SAP Number
// Row 4: "HR Sections" category header
// Row 5-6: Column headers (A=Length mm, B=Unit Wt, C=Qty Nos, D=Grade, E=Material, F=Qty MT)
// Rows 7-29: Section data
// Row 30: Section total
// Row 31: Spacer
// Row 32: "HR Plates" header
// Row 33: Plate column headers (A=Length mm, B=Width mm, C=Qty Nos, D=Grade, E=thk mm, F=Qty MT)
// Rows 34-48: Plate data
// Row 49: Plate total

const SECTIONS_DATA_START = 7;
const SECTIONS_DATA_END = 29;
const SECTIONS_TOTAL_ROW = 30;
const PLATES_DATA_START = 34;
const PLATES_DATA_END = 48;
const PLATES_TOTAL_ROW = 49;

// Column indices (1-based for ExcelJS)
const COL_A = 1; // Length in mm / Length in mm (plates)
const COL_B = 2; // Unit Wt kg/m / Width in mm (plates)
const COL_C = 3; // Qty in Nos
const COL_D = 4; // Material Grade
const COL_E = 5; // Material (sections) / thk in mm (plates)
const COL_F = 6; // Qty in MT

function getCellNum(row: ExcelJS.Row, col: number): number {
  const cell = row.getCell(col);
  const v = cell.value;
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v instanceof Object && "result" in v) return (v as ExcelJS.CellFormulaValue).result as number || 0;
  return 0;
}

function getCellStr(row: ExcelJS.Row, col: number): string {
  const cell = row.getCell(col);
  const v = cell.value;
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  if (v instanceof Object && "richText" in v) {
    return (v as ExcelJS.CellRichTextValue).richText.map((r) => r.text).join("").trim();
  }
  if (v instanceof Object && "text" in v) return (v as ExcelJS.CellHyperlinkValue).text.trim();
  return String(v).trim();
}

export async function parseIndentTemplate(): Promise<{
  sections: IndentSectionRow[];
  plates: IndentPlateRow[];
}> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(TEMPLATE_PATH);
  const ws = workbook.getWorksheet(1);
  if (!ws) throw new Error("Cannot read indent template worksheet.");

  const sections: IndentSectionRow[] = [];
  const plates: IndentPlateRow[] = [];

  // Parse section rows
  for (let r = SECTIONS_DATA_START; r <= SECTIONS_DATA_END; r++) {
    const row = ws.getRow(r);
    const material = getCellStr(row, COL_E);
    if (!material) continue;

    const stdLen = getCellNum(row, COL_A);
    const unitWt = getCellNum(row, COL_B);
    if (stdLen === 0 && unitWt === 0) continue;

    sections.push({
      rowNum: r,
      standardLength: stdLen,
      unitWeight: unitWt,
      qtyInNos: getCellNum(row, COL_C),
      grade: getCellStr(row, COL_D),
      material,
      qtyInMT: getCellNum(row, COL_F),
    });
  }

  // Parse plate rows
  for (let r = PLATES_DATA_START; r <= PLATES_DATA_END; r++) {
    const row = ws.getRow(r);
    const thkVal = getCellNum(row, COL_E);
    if (thkVal === 0) continue;

    const lengthVal = getCellNum(row, COL_A);
    if (lengthVal === 0) continue;

    plates.push({
      rowNum: r,
      length: lengthVal,
      width: getCellNum(row, COL_B),
      qtyInNos: getCellNum(row, COL_C),
      grade: getCellStr(row, COL_D),
      thickness: thkVal,
      qtyInMT: getCellNum(row, COL_F),
    });
  }

  return { sections, plates };
}

export async function generateIndent(
  sections: SectionGroup[],
  plates: PlateGroup[],
  projectDetails: ProjectDetails
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(TEMPLATE_PATH);
  const ws = workbook.getWorksheet(1);
  if (!ws) throw new Error("Cannot read indent template worksheet.");

  // Helper: set a cell value while preserving style
  function setVal(rowNum: number, colNum: number, value: number | string) {
    const cell = ws!.getCell(rowNum, colNum);
    cell.value = value;
  }

  // Update project details
  // Cell B1: project number
  setVal(1, 2, projectDetails.projectNumber || "");
  // Cell B2: date
  setVal(2, 2, projectDetails.date || "");
  // Cell I2: phase number
  setVal(2, 9, projectDetails.phaseNumber || "");
  // Cell I3: SAP number
  setVal(3, 9, projectDetails.sapNumber || "");

  // Build a lookup map: normalized profile → section group
  const sectionsByProfile = new Map<string, SectionGroup>();
  for (const s of sections) {
    sectionsByProfile.set(s.normalizedProfile, s);
  }

  // Build a lookup map: thickness → plate group
  const platesByThk = new Map<number, PlateGroup>();
  for (const p of plates) {
    platesByThk.set(p.thickness, p);
  }

  let sectionTotal = 0;

  // Track which profiles have already been assigned to handle duplicate profile rows
  const assignedProfiles = new Set<string>();

  // Update section rows
  for (let r = SECTIONS_DATA_START; r <= SECTIONS_DATA_END; r++) {
    const row = ws.getRow(r);
    const material = getCellStr(row, COL_E);
    if (!material) continue;

    const norm = normalizeSectionName(material);
    const group = sectionsByProfile.get(norm);
    const stdLen = getCellNum(row, COL_A);
    const unitWt = getCellNum(row, COL_B);

    // If this profile was already assigned (duplicate row), zero out this row
    const alreadyAssigned = assignedProfiles.has(norm);

    if (group && !alreadyAssigned) {
      const qty = group.requiredPieces;
      const qtyMT = parseFloat(
        ((stdLen / 1000) * unitWt * qty / 1000).toFixed(4)
      );
      setVal(r, COL_C, qty);
      setVal(r, COL_F, qtyMT);
      sectionTotal += qtyMT;
      assignedProfiles.add(norm);
    } else {
      // Zero out quantity for unmatched or duplicate template rows
      setVal(r, COL_C, 0);
      setVal(r, COL_F, 0);
    }
  }

  // Update section total row
  setVal(SECTIONS_TOTAL_ROW, COL_F, parseFloat(sectionTotal.toFixed(4)));

  let plateTotal = 0;

  // Update plate rows
  for (let r = PLATES_DATA_START; r <= PLATES_DATA_END; r++) {
    const row = ws.getRow(r);
    const thk = getCellNum(row, COL_E);
    if (thk === 0) continue;

    const group = platesByThk.get(thk);

    if (group) {
      const len = group.standardLength;
      const wid = group.standardWidth;
      const qty = group.requiredPlates;
      // User's formula: =(thk * wid * len * qty * 7.85) / 1e9  → gives MT directly
      const qtyMT = parseFloat(
        (thk * wid * len * qty * 7.85 / 1e9).toFixed(4)
      );

      setVal(r, COL_A, len);
      setVal(r, COL_B, wid);
      setVal(r, COL_C, qty);
      setVal(r, COL_F, qtyMT);
      plateTotal += qtyMT;

      // Remove this from map so we know it was matched
      platesByThk.delete(thk);
    } else {
      // Zero out
      setVal(r, COL_C, 0);
      setVal(r, COL_F, 0);
    }
  }

  // Update plate total row
  setVal(PLATES_TOTAL_ROW, COL_F, parseFloat(plateTotal.toFixed(4)));

  // Write to buffer
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
