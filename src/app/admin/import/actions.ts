"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ImportSummary {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

function emptySummary(): ImportSummary {
  return { created: 0, updated: 0, skipped: 0, errors: [] };
}

async function getOrCreateCategory(name: string) {
  const trimmed = name.trim();
  return prisma.productCategory.upsert({
    where: { name: trimmed },
    update: {},
    create: { name: trimmed },
  });
}

async function getSupplierByCode(code: string) {
  return prisma.supplier.findUnique({ where: { code: code.trim().toUpperCase() } });
}

// ---------------------------------------------------------------------------
// Fabrics
// columns: category, fabric
// ---------------------------------------------------------------------------
export async function importFabrics(rows: Record<string, string>[]): Promise<ImportSummary> {
  const summary = emptySummary();

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2; // header is row 1
    const categoryName = row.category?.trim();
    const fabricName = row.fabric?.trim();

    if (!categoryName || !fabricName) {
      summary.errors.push(`Row ${rowNum}: category and fabric are required.`);
      summary.skipped++;
      continue;
    }

    try {
      const category = await getOrCreateCategory(categoryName);
      await prisma.fabric.upsert({
        where: { categoryId_name: { categoryId: category.id, name: fabricName } },
        update: {},
        create: { categoryId: category.id, name: fabricName },
      });
      summary.created++;
    } catch (e) {
      summary.errors.push(`Row ${rowNum}: ${(e as Error).message}`);
      summary.skipped++;
    }
  }

  revalidatePath("/admin/catalogue");
  return summary;
}

// ---------------------------------------------------------------------------
// Colours — informational only, scoped to a category (not a specific
// fabric — the real data has no reliable per-fabric colour link).
// columns: category, colour
// ---------------------------------------------------------------------------
export async function importColours(rows: Record<string, string>[]): Promise<ImportSummary> {
  const summary = emptySummary();

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2;
    const categoryName = row.category?.trim();
    const colourName = row.colour?.trim();

    if (!categoryName || !colourName) {
      summary.errors.push(`Row ${rowNum}: category and colour are required.`);
      summary.skipped++;
      continue;
    }

    const category = await getOrCreateCategory(categoryName);
    await prisma.colour.upsert({
      where: { categoryId_name: { categoryId: category.id, name: colourName } },
      update: {},
      create: { categoryId: category.id, name: colourName },
    });
    summary.created++;
  }

  revalidatePath("/admin/catalogue");
  return summary;
}

// ---------------------------------------------------------------------------
// Fabric -> Band mappings, per supplier
// columns: supplierCode, category, fabric, band, priceTableRef, notes
//
// priceTableRef (not band) is the actual join key into Price List Rows — use
// the source price table's own reference/ID here, since the human-readable
// band label can repeat across genuinely different price tables. Duplicates
// for the same fabric with a DIFFERENT priceTableRef are allowed on purpose
// (that's the real "multiple matches" scenario the app must surface) — only
// an exact repeat of the same row is treated as a no-op.
// ---------------------------------------------------------------------------
export async function importBandMappings(rows: Record<string, string>[]): Promise<ImportSummary> {
  const summary = emptySummary();

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2;
    const supplierCode = row.supplierCode?.trim();
    const categoryName = row.category?.trim();
    const fabricName = row.fabric?.trim();
    const band = row.band?.trim();
    const priceTableRef = row.priceTableRef?.trim() || band;
    const notes = row.notes?.trim() || null;

    if (!supplierCode || !categoryName || !fabricName || !band) {
      summary.errors.push(`Row ${rowNum}: supplierCode, category, fabric and band are required.`);
      summary.skipped++;
      continue;
    }

    const supplier = await getSupplierByCode(supplierCode);
    if (!supplier) {
      summary.errors.push(`Row ${rowNum}: unknown supplier code "${supplierCode}".`);
      summary.skipped++;
      continue;
    }

    const category = await prisma.productCategory.findUnique({ where: { name: categoryName } });
    if (!category) {
      summary.errors.push(`Row ${rowNum}: unknown category "${categoryName}" — import fabrics first.`);
      summary.skipped++;
      continue;
    }

    const fabric = await prisma.fabric.findUnique({
      where: { categoryId_name: { categoryId: category.id, name: fabricName } },
    });
    if (!fabric) {
      summary.errors.push(`Row ${rowNum}: unknown fabric "${fabricName}" in "${categoryName}" — import fabrics first.`);
      summary.skipped++;
      continue;
    }

    const existing = await prisma.fabricBandMapping.findFirst({
      where: { supplierId: supplier.id, categoryId: category.id, fabricId: fabric.id, priceTableRef },
    });
    if (existing) {
      summary.skipped++;
      continue;
    }

    await prisma.fabricBandMapping.create({
      data: { supplierId: supplier.id, categoryId: category.id, fabricId: fabric.id, band, priceTableRef, notes },
    });
    summary.created++;
  }

  revalidatePath("/admin/catalogue");
  return summary;
}

// ---------------------------------------------------------------------------
// Price list rows, per supplier
// columns: supplierCode, category, band, priceTableRef, widthFrom, widthTo, dropFrom, dropTo, listPriceExVat
// priceTableRef is the authoritative join key (see importBandMappings).
// ---------------------------------------------------------------------------
export async function importPriceListRows(rows: Record<string, string>[]): Promise<ImportSummary> {
  const summary = emptySummary();

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2;
    const supplierCode = row.supplierCode?.trim();
    const categoryName = row.category?.trim();
    const band = row.band?.trim();
    const priceTableRef = row.priceTableRef?.trim() || band;
    const widthFrom = Number(row.widthFrom);
    const widthTo = Number(row.widthTo);
    const dropFrom = Number(row.dropFrom);
    const dropTo = Number(row.dropTo);
    const price = Number(row.listPriceExVat);

    if (!supplierCode || !categoryName || !band || [widthFrom, widthTo, dropFrom, dropTo, price].some(Number.isNaN)) {
      summary.errors.push(`Row ${rowNum}: missing or invalid numeric fields.`);
      summary.skipped++;
      continue;
    }

    const supplier = await getSupplierByCode(supplierCode);
    if (!supplier) {
      summary.errors.push(`Row ${rowNum}: unknown supplier code "${supplierCode}".`);
      summary.skipped++;
      continue;
    }
    const category = await prisma.productCategory.findUnique({ where: { name: categoryName } });
    if (!category) {
      summary.errors.push(`Row ${rowNum}: unknown category "${categoryName}".`);
      summary.skipped++;
      continue;
    }

    const existing = await prisma.priceListRow.findFirst({
      where: {
        supplierId: supplier.id,
        categoryId: category.id,
        priceTableRef,
        widthFromMm: widthFrom,
        widthToMm: widthTo,
        dropFromMm: dropFrom,
        dropToMm: dropTo,
        listPriceExVat: new Prisma.Decimal(price),
      },
    });
    if (existing) {
      summary.skipped++;
      continue;
    }

    await prisma.priceListRow.create({
      data: {
        supplierId: supplier.id,
        categoryId: category.id,
        band,
        priceTableRef,
        widthFromMm: widthFrom,
        widthToMm: widthTo,
        dropFromMm: dropFrom,
        dropToMm: dropTo,
        listPriceExVat: new Prisma.Decimal(price),
      },
    });
    summary.created++;
  }

  revalidatePath("/admin/catalogue");
  return summary;
}

// ---------------------------------------------------------------------------
// Discount rates, per supplier. Leave category blank for the default fallback.
// columns: supplierCode, category (optional), discountPercent
// ---------------------------------------------------------------------------
export async function importDiscountRates(rows: Record<string, string>[]): Promise<ImportSummary> {
  const summary = emptySummary();

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2;
    const supplierCode = row.supplierCode?.trim();
    const categoryName = row.category?.trim();
    const discountPercent = Number(row.discountPercent);

    if (!supplierCode || Number.isNaN(discountPercent)) {
      summary.errors.push(`Row ${rowNum}: supplierCode and discountPercent are required.`);
      summary.skipped++;
      continue;
    }

    const supplier = await getSupplierByCode(supplierCode);
    if (!supplier) {
      summary.errors.push(`Row ${rowNum}: unknown supplier code "${supplierCode}".`);
      summary.skipped++;
      continue;
    }

    let categoryId: string | null = null;
    if (categoryName) {
      const category = await getOrCreateCategory(categoryName);
      categoryId = category.id;
    }

    // Prisma's generated unique-input type won't accept null for a nullable
    // field in a compound @@unique, so upsert-by-compound-key isn't usable
    // here — look up manually instead.
    const existingRate = await prisma.discountRate.findFirst({
      where: { supplierId: supplier.id, categoryId },
    });
    if (existingRate) {
      await prisma.discountRate.update({
        where: { id: existingRate.id },
        data: { discountPercent: new Prisma.Decimal(discountPercent), isDefault: !categoryId },
      });
    } else {
      await prisma.discountRate.create({
        data: {
          supplierId: supplier.id,
          categoryId,
          discountPercent: new Prisma.Decimal(discountPercent),
          isDefault: !categoryId,
        },
      });
    }
    summary.created++;
  }

  revalidatePath("/admin/catalogue");
  return summary;
}

// ---------------------------------------------------------------------------
// Max size rules
// columns: category, system, minWidth (optional), maxWidth, minDrop (optional), maxDrop
// ---------------------------------------------------------------------------
export async function importMaxSizeRules(rows: Record<string, string>[]): Promise<ImportSummary> {
  const summary = emptySummary();

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2;
    const categoryName = row.category?.trim();
    const system = row.system?.trim();
    const maxWidth = Number(row.maxWidth);
    const maxDrop = Number(row.maxDrop);
    const minWidth = row.minWidth ? Number(row.minWidth) : null;
    const minDrop = row.minDrop ? Number(row.minDrop) : null;

    if (!categoryName || !system || Number.isNaN(maxWidth) || Number.isNaN(maxDrop)) {
      summary.errors.push(`Row ${rowNum}: category, system, maxWidth and maxDrop are required.`);
      summary.skipped++;
      continue;
    }

    const category = await getOrCreateCategory(categoryName);

    await prisma.maxSizeRule.upsert({
      where: { categoryId_system: { categoryId: category.id, system } },
      update: { maxWidthMm: maxWidth, maxDropMm: maxDrop, minWidthMm: minWidth, minDropMm: minDrop },
      create: {
        categoryId: category.id,
        system,
        maxWidthMm: maxWidth,
        maxDropMm: maxDrop,
        minWidthMm: minWidth,
        minDropMm: minDrop,
      },
    });
    summary.created++;
  }

  revalidatePath("/admin/catalogue");
  return summary;
}
