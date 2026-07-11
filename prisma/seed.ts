/**
 * Seeds only structural reference data described directly in the project
 * brief — no fabricated fabrics, prices, discounts, or max-size numbers.
 * Real pricing/fabric/colour/size data arrives later via CSV import
 * (see /admin/import) and Admin > Settings for VAT / margin multipliers.
 */
import { PrismaClient, SupplierPricingType, PricingMode } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.supplier.upsert({
    where: { code: "DECORA" },
    update: {},
    create: {
      name: "Decora",
      code: "DECORA",
      pricingType: SupplierPricingType.NEGOTIATED_DISCOUNT,
      creditTerms: "Trade credit account",
    },
  });

  await prisma.supplier.upsert({
    where: { code: "BEVERLEY" },
    update: {},
    create: {
      name: "Beverley Blinds",
      code: "BEVERLEY",
      pricingType: SupplierPricingType.FIXED_PRICE,
      creditTerms: "Invoice due by the 20th of the month following the invoice date",
    },
  });

  // Categories named directly in the brief. Extend/correct via CSV import
  // once the real category list is available.
  const categoryNames = [
    "FB Roller",
    "Fauxwood",
    "Starwood",
    "Vertical",
    "Timberlux",
    "Perfect Fit Aluminium-Roller-Softshade",
  ];
  for (const name of categoryNames) {
    await prisma.productCategory.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Neutral (1.0000) placeholder multipliers — the business hasn't supplied
  // real Premium vs Negotiation margin figures yet. Edit in Admin > Settings.
  await prisma.pricingModeRate.upsert({
    where: { mode: PricingMode.PREMIUM },
    update: {},
    create: { mode: PricingMode.PREMIUM, multiplier: "1.0000" },
  });
  await prisma.pricingModeRate.upsert({
    where: { mode: PricingMode.NEGOTIATION },
    update: {},
    create: { mode: PricingMode.NEGOTIATION, multiplier: "1.0000" },
  });

  await prisma.appSetting.upsert({
    where: { key: "vatPercent" },
    update: {},
    create: { key: "vatPercent", value: "20" },
  });

  console.log("Seed complete: suppliers, categories, mode multipliers, VAT setting.");
  console.log("No fabrics, prices, discounts, or max-size rules were seeded — import those via /admin/import.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
