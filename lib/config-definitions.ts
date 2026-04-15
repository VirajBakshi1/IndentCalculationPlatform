// Pure constants — no DB imports. Safe for client and server bundles.

export type ConfigGroup = "general" | "sections" | "plates";
export type ConfigTypeValue = "NUMBER" | "STRING" | "BOOLEAN";

export interface ConfigDefinition {
  key: string;
  label: string;
  description: string;
  group: ConfigGroup;
  type: ConfigTypeValue;
  unit?: string;
  defaultValue: string;
}

export const CONFIG_DEFINITIONS: ConfigDefinition[] = [
  {
    key: "steelDensity",
    label: "Steel Density",
    description: "Density of structural steel used in all weight calculations.",
    group: "general",
    type: "NUMBER",
    unit: "g/cm³",
    defaultValue: "7.85",
  },
  {
    key: "plateScrapFactor",
    label: "Plate Scrap Factor",
    description:
      "Multiplier applied to net plate area when ordering multiple standard plates to account for cutting waste. 1.10 = 10% waste.",
    group: "plates",
    type: "NUMBER",
    unit: "multiplier",
    defaultValue: "1.10",
  },
  {
    key: "plateMaxLength",
    label: "Standard Plate Max Length",
    description: "Maximum length of a standard plate ordered from the steel mill.",
    group: "plates",
    type: "NUMBER",
    unit: "mm",
    defaultValue: "12000",
  },
  {
    key: "plateHeavyThreshold",
    label: "Heavy Plate Thickness Threshold",
    description:
      "Plates at or above this thickness are ordered as wide (2500 mm) plates. Below this threshold the narrower (2000 mm) stock is used.",
    group: "plates",
    type: "NUMBER",
    unit: "mm",
    defaultValue: "30",
  },
  {
    key: "plateHeavyWidth",
    label: "Heavy Plate Standard Width",
    description: "Standard width for plates with thickness ≥ heavy threshold.",
    group: "plates",
    type: "NUMBER",
    unit: "mm",
    defaultValue: "2500",
  },
  {
    key: "plateLightWidth",
    label: "Light Plate Standard Width",
    description: "Standard width for plates with thickness < heavy threshold.",
    group: "plates",
    type: "NUMBER",
    unit: "mm",
    defaultValue: "2000",
  },
  {
    key: "plateDefaultGrade",
    label: "Default Plate Grade",
    description: "Material grade used when the MTO row has no grade specified.",
    group: "plates",
    type: "STRING",
    defaultValue: "E250",
  },
  {
    key: "sectionDefaultLength",
    label: "Default Section Standard Length",
    description: "Fallback standard length for sections not found in the indent template.",
    group: "sections",
    type: "NUMBER",
    unit: "mm",
    defaultValue: "12000",
  },
  {
    key: "sectionDefaultGrade",
    label: "Default Section Grade",
    description: "Material grade used when the MTO row has no grade specified.",
    group: "sections",
    type: "STRING",
    defaultValue: "E250",
  },
];
