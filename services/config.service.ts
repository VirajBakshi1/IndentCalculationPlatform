import { db } from "@/lib/db";
import { CONFIG_DEFINITIONS } from "@/lib/config-definitions";

export type { ConfigDefinition } from "@/lib/config-definitions";
export { CONFIG_DEFINITIONS } from "@/lib/config-definitions";

// ─── App Config shape (used by material-classifier) ──────────────────────────

export interface AppConfig {
  // General
  steelDensity: number;          // g/cm³ (default 7.85)

  // Plates
  plateScrapFactor: number;      // e.g. 1.10 = 10% waste (default 1.10)
  plateMaxLength: number;        // mm (default 12000)
  plateHeavyThreshold: number;   // mm — thk >= this uses heavyWidth (default 30)
  plateHeavyWidth: number;       // mm (default 2500)
  plateLightWidth: number;       // mm (default 2000)
  plateDefaultGrade: string;     // (default "E250")

  // Sections
  sectionDefaultLength: number;  // mm (default 12000)
  sectionDefaultGrade: string;   // (default "E250")
}

// ─── Hardcoded fallback defaults ──────────────────────────────────────────────

export const DEFAULT_CONFIG: AppConfig = {
  steelDensity: 7.85,
  plateScrapFactor: 1.10,
  plateMaxLength: 12000,
  plateHeavyThreshold: 30,
  plateHeavyWidth: 2500,
  plateLightWidth: 2000,
  plateDefaultGrade: "E250",
  sectionDefaultLength: 12000,
  sectionDefaultGrade: "E250",
};

// ─── Seed configs into DB (run once / on first load) ─────────────────────────

export async function seedDefaultConfigs() {
  for (const def of CONFIG_DEFINITIONS) {
    await db.config.upsert({
      where: { key: def.key },
      update: {},               // never overwrite existing values
      create: {
        key: def.key,
        value: def.defaultValue,
        type: def.type,
        label: def.label,
        description: def.description,
        group: def.group,
        unit: def.unit ?? null,
      },
    });
  }
}

// ─── Read all configs and return as AppConfig ─────────────────────────────────

export async function getAppConfig(): Promise<AppConfig> {
  try {
    const rows = await db.config.findMany();
    if (rows.length === 0) {
      await seedDefaultConfigs();
      return { ...DEFAULT_CONFIG };
    }

    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const num = (key: string, fallback: number) =>
      parseFloat(map[key] ?? String(fallback)) || fallback;
    const str = (key: string, fallback: string) => map[key] ?? fallback;

    return {
      steelDensity: num("steelDensity", DEFAULT_CONFIG.steelDensity),
      plateScrapFactor: num("plateScrapFactor", DEFAULT_CONFIG.plateScrapFactor),
      plateMaxLength: num("plateMaxLength", DEFAULT_CONFIG.plateMaxLength),
      plateHeavyThreshold: num("plateHeavyThreshold", DEFAULT_CONFIG.plateHeavyThreshold),
      plateHeavyWidth: num("plateHeavyWidth", DEFAULT_CONFIG.plateHeavyWidth),
      plateLightWidth: num("plateLightWidth", DEFAULT_CONFIG.plateLightWidth),
      plateDefaultGrade: str("plateDefaultGrade", DEFAULT_CONFIG.plateDefaultGrade),
      sectionDefaultLength: num("sectionDefaultLength", DEFAULT_CONFIG.sectionDefaultLength),
      sectionDefaultGrade: str("sectionDefaultGrade", DEFAULT_CONFIG.sectionDefaultGrade),
    };
  } catch {
    // If DB is unreachable, fall back to hardcoded defaults
    return { ...DEFAULT_CONFIG };
  }
}

// ─── Update a single config key ───────────────────────────────────────────────

export async function updateConfig(
  key: string,
  value: string,
  changedBy: string
): Promise<{ success: boolean; error?: string }> {
  const def = CONFIG_DEFINITIONS.find((d) => d.key === key);
  if (!def) return { success: false, error: "Unknown config key" };

  // Type-check the value
  if (def.type === "NUMBER") {
    const n = parseFloat(value);
    if (isNaN(n)) return { success: false, error: "Value must be a number" };
    if (n <= 0) return { success: false, error: "Value must be greater than 0" };
  }

  const existing = await db.config.findUnique({ where: { key } });
  if (!existing) return { success: false, error: "Config not found" };

  await db.$transaction([
    db.config.update({
      where: { key },
      data: { value, updatedBy: changedBy },
    }),
    db.configHistory.create({
      data: {
        configId: existing.id,
        key,
        oldValue: existing.value,
        newValue: value,
        changedBy,
      },
    }),
  ]);

  return { success: true };
}

// ─── Batch update ─────────────────────────────────────────────────────────────

export async function batchUpdateConfig(
  updates: { key: string; value: string }[],
  changedBy: string
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  for (const u of updates) {
    const result = await updateConfig(u.key, u.value, changedBy);
    if (!result.success) errors.push(`${u.key}: ${result.error}`);
  }
  return { success: errors.length === 0, errors };
}

// ─── Get history for a key ────────────────────────────────────────────────────

export async function getConfigHistory(key: string) {
  return db.configHistory.findMany({
    where: { key },
    orderBy: { changedAt: "desc" },
    take: 20,
  });
}

// ─── Reset to default ─────────────────────────────────────────────────────────

export async function resetConfigToDefault(key: string, changedBy: string) {
  const def = CONFIG_DEFINITIONS.find((d) => d.key === key);
  if (!def) return { success: false, error: "Unknown config key" };
  return updateConfig(key, def.defaultValue, changedBy);
}
