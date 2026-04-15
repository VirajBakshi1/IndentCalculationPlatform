import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CONFIG_DEFINITIONS } from "../lib/config-definitions";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database…");

  // 1. Seed all config keys (never overwrites existing values)
  for (const def of CONFIG_DEFINITIONS) {
    await db.config.upsert({
      where: { key: def.key },
      update: {},
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
  console.log(`  ✓ ${CONFIG_DEFINITIONS.length} config keys seeded`);

  // 2. Seed first admin user (only if SEED_ADMIN_EMAIL is set)
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const normalizedEmail = adminEmail.toLowerCase().trim();

    // Add to whitelist
    await db.adminEmail.upsert({
      where: { email: normalizedEmail },
      update: {},
      create: { email: normalizedEmail, addedBy: "seed" },
    });

    // Create or promote user
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      await db.user.update({
        where: { email: normalizedEmail },
        data: { role: "ADMIN" },
      });
      console.log(`  ✓ Existing user ${normalizedEmail} promoted to ADMIN`);
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await db.user.create({
        data: {
          email: normalizedEmail,
          name: "Admin",
          password: hashedPassword,
          role: "ADMIN",
        },
      });
      console.log(`  ✓ Admin user ${normalizedEmail} created`);
    }
  } else {
    console.log("  ℹ  Set SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD to seed an admin user");
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
