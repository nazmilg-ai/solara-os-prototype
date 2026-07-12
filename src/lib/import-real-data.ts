/**
 * Core logic for importing the real pricing/fabric/colour/size/settings CSVs
 * (Product_Category_Master.csv, Fabric_and_Item_Band_Master.csv,
 * Colour_Master.csv, Beverley_Fabric_Bands.csv, Price_Table_Master.csv,
 * Max_Size_Master.csv, Settings.csv) that live at the repo root.
 *
 * Shared between the CLI script (scripts/import-real-data.ts, for local/
 * manual runs) and the Admin > Import "Full Data Refresh" button
 * (src/app/admin/import/real-data-actions.ts, for triggering it from the
 * running app without needing direct database access).
 *
 * Wipes and reloads all category/fabric/colour/band/price/discount/
 * max-size data (never suppliers, customers, or quotes) so it's safe to
 * re-run whenever an updated CSV drop arrives.
 */
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { PrismaClient, Prisma, SupplierPricingType, PricingMode } from "@prisma/client";

export interface RealDataImportReport {
  categories: number;
  fabrics: number;
  bandMappingsCreated: number;
  bandMappingsSkipped: number;
  priceRowsCreated: number;
  priceRowsSkipped: number;
  coloursCreated: number;
  beverleyBandsCreated: number;
  beverleyBandsSkipped: number;
  maxSizeRulesCreated: number;
  maxSizeRulesSkipped: number;
  discountOverridesCreated: number;
  discountOverridesSkipped: number;
  vatPercent: string | null;
  defaultDepositPercent: string | null;
  premiumMultiplier: string | null;
  negotiationMultiplier: string | null;
}

const REQUIRED_FILES = [
  "Product_Category_Master.csv",
  "Fabric_and_Item_Band_Master.csv",
  "Price_Table_Master.csv",
  "Colour_Master.csv",
  "Beverley_Fabric_Bands.csv",
  "Max_Size_Master.csv",
  "Settings.csv",
];

export async function importRealData(prisma: PrismaClient, rootDir: string): Promise<RealDataImportReport> {
  const missing = REQUIRED_FILES.filter((f) => !fs.existsSync(path.join(rootDir, f)));
  if (missing.length > 0) {
    throw new Error(`Missing CSV file(s) at repo root: ${missing.join(", ")}`);
  }

  function parseCsvWithHeaderAt(fileName: string, headerRowIndex: number): Record<string, string>[] {
    const content = fs.readFileSync(path.join(rootDir, fileName), "utf-8");
    const { data } = Papa.parse<string[]>(content, { skipEmptyLines: false });
    const rows = data as string[][];
    const header = rows[headerRowIndex].map((h) => h.trim());
    return rows.slice(headerRowIndex + 1).map((row) => {
      const obj: Record<string, string> = {};
      header.forEach((h, i) => {
        obj[h] = (row[i] ?? "").trim();
      });
      return obj;
    });
  }

  const categoryCache = new Map<string, string>();
  async function ensureCategory(name: string): Promise<string> {
    const trimmed = name.trim();
    const cached = categoryCache.get(trimmed);
    if (cached) return cached;
    const category = await prisma.productCategory.upsert({
      where: { name: trimmed },
      update: {},
      create: { name: trimmed },
    });
    categoryCache.set(trimmed, category.id);
    return category.id;
  }

  const fabricCache = new Map<string, string>();
  async function ensureFabric(categoryId: string, name: string): Promise<string> {
    const key = `${categoryId}::${name}`;
    const cached = fabricCache.get(key);
    if (cached) return cached;
    const fabric = await prisma.fabric.upsert({
      where: { categoryId_name: { categoryId, name } },
      update: {},
      create: { categoryId, name },
    });
    fabricCache.set(key, fabric.id);
    return fabric.id;
  }

  async function chunkedCreateMany<T>(
    model: { createMany: (args: { data: T[] }) => Promise<unknown> },
    rows: T[],
    size = 5000
  ) {
    for (let i = 0; i < rows.length; i += size) {
      await model.createMany({ data: rows.slice(i, i + size) });
    }
  }

  // -------------------------------------------------------------------
  // Wipe existing category/fabric/colour/band/price/discount/max-size
  // data. ProductCategory cascades to Fabric, FabricBandMapping,
  // PriceListRow, MaxSizeRule, and Colour. DiscountRate needs an explicit
  // delete too since its supplier-level default fallback rows
  // (categoryId = null) don't cascade from a category delete.
  // -------------------------------------------------------------------
  await prisma.discountRate.deleteMany({});
  await prisma.productCategory.deleteMany({});

  const decora = await prisma.supplier.upsert({
    where: { code: "DECORA" },
    update: {},
    create: {
      name: "Decora",
      code: "DECORA",
      pricingType: SupplierPricingType.NEGOTIATED_DISCOUNT,
      creditTerms: "Trade credit account",
    },
  });
  const beverley = await prisma.supplier.upsert({
    where: { code: "BEVERLEY" },
    update: {},
    create: {
      name: "Beverley Blinds",
      code: "BEVERLEY",
      pricingType: SupplierPricingType.FIXED_PRICE,
      creditTerms: "Invoice due by the 20th of the month following the invoice date",
    },
  });

  // 1. Categories
  const categoryRows = parseCsvWithHeaderAt("Product_Category_Master.csv", 1);
  for (const row of categoryRows) {
    if (row["Product Category"]) await ensureCategory(row["Product Category"]);
  }

  // 2. Decora Fabrics + Band Mappings
  const fabricBandRows = parseCsvWithHeaderAt("Fabric_and_Item_Band_Master.csv", 1);
  let bandMappingsCreated = 0;
  let bandMappingsSkipped = 0;
  const bandMappingData: Prisma.FabricBandMappingCreateManyInput[] = [];
  for (const row of fabricBandRows) {
    const categoryName = row["Product Category"];
    const fabricName = row["Fabric/Item Name"];
    const band = row["Band"];
    const priceTableRef = row["Price Table Reference"];
    if (!categoryName || !fabricName || !priceTableRef) {
      bandMappingsSkipped++;
      continue;
    }
    const categoryId = await ensureCategory(categoryName);
    const fabricId = await ensureFabric(categoryId, fabricName);
    bandMappingData.push({
      supplierId: decora.id,
      categoryId,
      fabricId,
      band: band || fabricName,
      priceTableRef,
      notes: row["Collection"] || null,
    });
    bandMappingsCreated++;
  }
  await chunkedCreateMany(prisma.fabricBandMapping, bandMappingData);

  // 3. Decora Price List Rows (large: ~34k rows)
  const priceRows = parseCsvWithHeaderAt("Price_Table_Master.csv", 1);
  let priceCreated = 0;
  let priceSkipped = 0;
  const priceData: Prisma.PriceListRowCreateManyInput[] = [];
  // Flat per-item prices (motorisation, accessories) have no width/drop in
  // the source — use a wide sentinel range so they always match regardless
  // of what the advisor enters, since the price genuinely doesn't vary by size.
  const FLAT_ITEM_RANGE = { from: 1, to: 100000 };
  for (const row of priceRows) {
    const categoryName = row["Product Category"];
    const priceTableRef = row["PT_ID"];
    const band = row["Band"];
    const priceRaw = row["Supplier List Price ex VAT"];
    if (!categoryName || !priceTableRef || !priceRaw) {
      priceSkipped++;
      continue;
    }
    const price = Number(priceRaw);
    if (Number.isNaN(price)) {
      priceSkipped++;
      continue;
    }
    const widthFromMm = row["Width From (mm)"] ? Number(row["Width From (mm)"]) : FLAT_ITEM_RANGE.from;
    const widthToMm = row["Width To (mm)"] ? Number(row["Width To (mm)"]) : FLAT_ITEM_RANGE.to;
    const dropFromMm = row["Drop From (mm)"] ? Number(row["Drop From (mm)"]) : FLAT_ITEM_RANGE.from;
    const dropToMm = row["Drop To (mm)"] ? Number(row["Drop To (mm)"]) : FLAT_ITEM_RANGE.to;
    if ([widthFromMm, widthToMm, dropFromMm, dropToMm].some(Number.isNaN)) {
      priceSkipped++;
      continue;
    }
    const categoryId = await ensureCategory(categoryName);
    priceData.push({
      supplierId: decora.id,
      categoryId,
      band: band || priceTableRef,
      priceTableRef,
      widthFromMm,
      widthToMm,
      dropFromMm,
      dropToMm,
      listPriceExVat: new Prisma.Decimal(price),
    });
    priceCreated++;
  }
  await chunkedCreateMany(prisma.priceListRow, priceData);

  // 4. Colours (informational only, scoped to category)
  const colourRows = parseCsvWithHeaderAt("Colour_Master.csv", 1);
  const seenColours = new Set<string>();
  let coloursCreated = 0;
  for (const row of colourRows) {
    const categoryName = row["Product Category"];
    const colourName = row["Colour Name"];
    if (!categoryName || !colourName) continue;
    const categoryId = await ensureCategory(categoryName);
    const key = `${categoryId}::${colourName}`;
    if (seenColours.has(key)) continue; // dedupe repeats across collections
    seenColours.add(key);
    await prisma.colour.upsert({
      where: { categoryId_name: { categoryId, name: colourName } },
      update: {},
      create: { categoryId, name: colourName },
    });
    coloursCreated++;
  }

  // 5. Beverley Fabric Bands (Roller + Vertical only; no price grid yet)
  const beverleyRows = parseCsvWithHeaderAt("Beverley_Fabric_Bands.csv", 2);
  let beverleyCreated = 0;
  let beverleySkipped = 0;
  const beverleyBandData: Prisma.FabricBandMappingCreateManyInput[] = [];
  for (const row of beverleyRows) {
    const blindType = row["Blind Type"];
    const fabricName = row["Fabric Name"];
    const band = row["Beverley Band"];
    if (!blindType || !fabricName || !band) {
      beverleySkipped++;
      continue;
    }
    const categoryId = await ensureCategory(blindType);
    const fabricId = await ensureFabric(categoryId, fabricName);
    beverleyBandData.push({
      supplierId: beverley.id,
      categoryId,
      fabricId,
      band,
      // Beverley has no price grid yet — use the band itself as the join
      // key placeholder so the schema is ready once real prices arrive.
      priceTableRef: band,
      notes: row["Fabric Brand"] || null,
    });
    beverleyCreated++;
  }
  await chunkedCreateMany(prisma.fabricBandMapping, beverleyBandData);

  // 6. Max Size Rules
  const maxSizeRows = parseCsvWithHeaderAt("Max_Size_Master.csv", 1);
  let maxSizeCreated = 0;
  let maxSizeSkipped = 0;
  for (const row of maxSizeRows) {
    const categoryName = row["Product Category"];
    const system = row["System / Mechanism"];
    const maxWidthRaw = row["Max Width (mm)"];
    const maxDropRaw = row["Max Drop (mm)"];
    // Number("") is 0, not NaN — an explicit blank check is required, or the
    // sheet's prose "known gaps" rows (blank width/drop, category name is a
    // long note) would slip through as bogus zero-sized rules.
    if (!categoryName || !system || !maxWidthRaw || !maxDropRaw) {
      maxSizeSkipped++;
      continue;
    }
    const maxWidth = Number(maxWidthRaw);
    const maxDrop = Number(maxDropRaw);
    if (Number.isNaN(maxWidth) || Number.isNaN(maxDrop)) {
      maxSizeSkipped++;
      continue;
    }
    const minWidth = row["Min Width (mm)"] ? Number(row["Min Width (mm)"]) : null;
    const minDrop = row["Min Drop (mm)"] ? Number(row["Min Drop (mm)"]) : null;
    const categoryId = await ensureCategory(categoryName);
    await prisma.maxSizeRule.upsert({
      where: { categoryId_system: { categoryId, system } },
      update: { maxWidthMm: maxWidth, maxDropMm: maxDrop, minWidthMm: minWidth, minDropMm: minDrop },
      create: { categoryId, system, maxWidthMm: maxWidth, maxDropMm: maxDrop, minWidthMm: minWidth, minDropMm: minDrop },
    });
    maxSizeCreated++;
  }

  // 7. Settings.csv — VAT, deposit default, mode multipliers, discount
  //    default + category overrides. Parsed by label, not row number, so
  //    the sheet can be reordered without breaking the import.
  const settingsContent = fs.readFileSync(path.join(rootDir, "Settings.csv"), "utf-8");
  const settingsRows = Papa.parse<string[]>(settingsContent, { skipEmptyLines: false }).data as string[][];

  function findLabelValue(label: string): string | null {
    const row = settingsRows.find((r) => r[1]?.trim() === label);
    return row ? row[2]?.trim() ?? null : null;
  }

  const vatRate = findLabelValue("VAT Rate");
  const defaultDiscount = findLabelValue("Default Decora Discount %");
  const premiumMultiplier = findLabelValue("Premium Margin Multiplier");
  const negotiationMultiplier = findLabelValue("Negotiation Margin Multiplier");
  const depositPercent = findLabelValue("Deposit %");

  if (vatRate) {
    await prisma.appSetting.upsert({
      where: { key: "vatPercent" },
      update: { value: String(Number(vatRate) * 100) },
      create: { key: "vatPercent", value: String(Number(vatRate) * 100) },
    });
  }
  if (depositPercent) {
    await prisma.appSetting.upsert({
      where: { key: "defaultDepositPercent" },
      update: { value: String(Number(depositPercent) * 100) },
      create: { key: "defaultDepositPercent", value: String(Number(depositPercent) * 100) },
    });
  }
  if (premiumMultiplier) {
    await prisma.pricingModeRate.upsert({
      where: { mode: PricingMode.PREMIUM },
      update: { multiplier: new Prisma.Decimal(premiumMultiplier) },
      create: { mode: PricingMode.PREMIUM, multiplier: new Prisma.Decimal(premiumMultiplier) },
    });
  }
  if (negotiationMultiplier) {
    await prisma.pricingModeRate.upsert({
      where: { mode: PricingMode.NEGOTIATION },
      update: { multiplier: new Prisma.Decimal(negotiationMultiplier) },
      create: { mode: PricingMode.NEGOTIATION, multiplier: new Prisma.Decimal(negotiationMultiplier) },
    });
  }

  if (defaultDiscount) {
    await prisma.discountRate.create({
      data: {
        supplierId: decora.id,
        categoryId: null,
        isDefault: true,
        discountPercent: new Prisma.Decimal(Number(defaultDiscount) * 100),
      },
    });
  }

  const overrideHeaderIndex = settingsRows.findIndex(
    (r) => r[1]?.trim() === "Product Category" && r[2]?.trim() === "Override Discount %"
  );
  let overridesCreated = 0;
  let overridesSkipped = 0;
  if (overrideHeaderIndex >= 0) {
    for (const row of settingsRows.slice(overrideHeaderIndex + 1)) {
      const categoryName = row[1]?.trim();
      const discountValue = row[2]?.trim();
      if (!categoryName || !discountValue) {
        overridesSkipped++;
        continue; // blank category = no confirmed mapping in the source sheet
      }
      const categoryId = await ensureCategory(categoryName);
      const existing = await prisma.discountRate.findFirst({ where: { supplierId: decora.id, categoryId } });
      if (existing) continue; // sheet has repeat rows for the same category at the same rate
      await prisma.discountRate.create({
        data: {
          supplierId: decora.id,
          categoryId,
          discountPercent: new Prisma.Decimal(Number(discountValue) * 100),
        },
      });
      overridesCreated++;
    }
  }

  return {
    categories: categoryCache.size,
    fabrics: fabricCache.size,
    bandMappingsCreated,
    bandMappingsSkipped,
    priceRowsCreated: priceCreated,
    priceRowsSkipped: priceSkipped,
    coloursCreated,
    beverleyBandsCreated: beverleyCreated,
    beverleyBandsSkipped: beverleySkipped,
    maxSizeRulesCreated: maxSizeCreated,
    maxSizeRulesSkipped: maxSizeSkipped,
    discountOverridesCreated: overridesCreated,
    discountOverridesSkipped: overridesSkipped,
    vatPercent: vatRate ? String(Number(vatRate) * 100) : null,
    defaultDepositPercent: depositPercent ? String(Number(depositPercent) * 100) : null,
    premiumMultiplier,
    negotiationMultiplier,
  };
}
