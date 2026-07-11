import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Prisma, SupplierPricingType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  calculateDepositSplit,
  calculateLine,
  checkSize,
  resolveBand,
  resolveDiscountPercent,
  resolvePrice,
} from "@/lib/pricing";

// Everything created in this suite is prefixed so it's trivially cleaned up
// and never collides with real data.
const PREFIX = "TEST__pricing__";

let decoraId: string;
let beverleyId: string;
let categoryId: string;
let fabricId: string;
let fabricNoBandId: string;
let fabricAmbiguousId: string;

beforeAll(async () => {
  const decora = await prisma.supplier.create({
    data: {
      name: `${PREFIX}Decora`,
      code: `${PREFIX}DECORA`,
      pricingType: SupplierPricingType.NEGOTIATED_DISCOUNT,
    },
  });
  decoraId = decora.id;

  const beverley = await prisma.supplier.create({
    data: {
      name: `${PREFIX}Beverley Blinds`,
      code: `${PREFIX}BEVERLEY`,
      pricingType: SupplierPricingType.FIXED_PRICE,
    },
  });
  beverleyId = beverley.id;

  const category = await prisma.productCategory.create({
    data: { name: `${PREFIX}FB Roller` },
  });
  categoryId = category.id;

  const fabric = await prisma.fabric.create({
    data: { categoryId, name: `${PREFIX}Bella (89/127mm)` },
  });
  fabricId = fabric.id;

  const fabricNoBand = await prisma.fabric.create({
    data: { categoryId, name: `${PREFIX}Unmapped Fabric` },
  });
  fabricNoBandId = fabricNoBand.id;

  const fabricAmbiguous = await prisma.fabric.create({
    data: { categoryId, name: `${PREFIX}Ambiguous Fabric` },
  });
  fabricAmbiguousId = fabricAmbiguous.id;

  // Clean single band mapping for `fabric`.
  await prisma.fabricBandMapping.create({
    data: { supplierId: decoraId, categoryId, fabricId, band: "B1" },
  });

  // Two conflicting rows (plain vs "with tapes" style data issue) for the
  // ambiguous fabric — must surface as "multiple".
  await prisma.fabricBandMapping.create({
    data: { supplierId: decoraId, categoryId, fabricId: fabricAmbiguousId, band: "B1" },
  });
  await prisma.fabricBandMapping.create({
    data: { supplierId: decoraId, categoryId, fabricId: fabricAmbiguousId, band: "B2" },
  });

  // Price rows for band B1: one clean range, one deliberately overlapping
  // range with a different price to exercise the "multiple match" price path.
  await prisma.priceListRow.create({
    data: {
      supplierId: decoraId,
      categoryId,
      band: "B1",
      widthFromMm: 0,
      widthToMm: 1000,
      dropFromMm: 0,
      dropToMm: 1000,
      listPriceExVat: new Prisma.Decimal("100.00"),
    },
  });
  await prisma.priceListRow.create({
    data: {
      supplierId: decoraId,
      categoryId,
      band: "B1",
      widthFromMm: 900,
      widthToMm: 1500,
      dropFromMm: 0,
      dropToMm: 1000,
      listPriceExVat: new Prisma.Decimal("140.00"),
    },
  });

  // Discount config: category-specific for FB Roller, plus a default fallback.
  await prisma.discountRate.create({
    data: { supplierId: decoraId, categoryId, discountPercent: new Prisma.Decimal("55.00") },
  });
  await prisma.discountRate.create({
    data: { supplierId: decoraId, categoryId: null, isDefault: true, discountPercent: new Prisma.Decimal("40.00") },
  });

  // Max size rule only for "Motorised" — "Manual" has no data on purpose.
  await prisma.maxSizeRule.create({
    data: { categoryId, system: "Motorised", maxWidthMm: 2000, maxDropMm: 2500 },
  });
});

afterAll(async () => {
  await prisma.priceListRow.deleteMany({ where: { supplierId: { in: [decoraId, beverleyId] } } });
  await prisma.fabricBandMapping.deleteMany({ where: { supplierId: { in: [decoraId, beverleyId] } } });
  await prisma.discountRate.deleteMany({ where: { supplierId: { in: [decoraId, beverleyId] } } });
  await prisma.maxSizeRule.deleteMany({ where: { categoryId } });
  await prisma.fabric.deleteMany({ where: { categoryId } });
  await prisma.productCategory.deleteMany({ where: { id: categoryId } });
  await prisma.supplier.deleteMany({ where: { id: { in: [decoraId, beverleyId] } } });
  await prisma.$disconnect();
});

describe("resolveBand", () => {
  it("returns not_found when no mapping exists", async () => {
    const result = await resolveBand(decoraId, categoryId, fabricNoBandId);
    expect(result.status).toBe("not_found");
  });

  it("returns found for a single clean mapping", async () => {
    const result = await resolveBand(decoraId, categoryId, fabricId);
    expect(result.status).toBe("found");
    if (result.status === "found") expect(result.value.band).toBe("B1");
  });

  it("returns multiple when two variants map to different bands", async () => {
    const result = await resolveBand(decoraId, categoryId, fabricAmbiguousId);
    expect(result.status).toBe("multiple");
    if (result.status === "multiple") {
      expect(result.candidates.map((c) => c.band).sort()).toEqual(["B1", "B2"]);
    }
  });
});

describe("resolvePrice", () => {
  it("returns not_found outside all ranges", async () => {
    const result = await resolvePrice(decoraId, categoryId, "B1", 5000, 5000);
    expect(result.status).toBe("not_found");
  });

  it("returns found in the non-overlapping region", async () => {
    const result = await resolvePrice(decoraId, categoryId, "B1", 500, 500);
    expect(result.status).toBe("found");
    if (result.status === "found") expect(result.value.listPriceExVat.toString()).toBe("100");
  });

  it("returns multiple in the overlapping region with conflicting prices", async () => {
    const result = await resolvePrice(decoraId, categoryId, "B1", 950, 500);
    expect(result.status).toBe("multiple");
    if (result.status === "multiple") expect(result.candidates.length).toBe(2);
  });
});

describe("resolveDiscountPercent", () => {
  it("uses the category-specific rate when present", async () => {
    const result = await resolveDiscountPercent(decoraId, categoryId);
    expect(result.source).toBe("category");
    expect(result.discountPercent.toString()).toBe("55");
  });

  it("falls back to the supplier default when no category rate exists", async () => {
    const otherCategory = await prisma.productCategory.create({ data: { name: `${PREFIX}Other Category` } });
    const result = await resolveDiscountPercent(decoraId, otherCategory.id);
    expect(result.source).toBe("default");
    expect(result.discountPercent.toString()).toBe("40");
    await prisma.productCategory.delete({ where: { id: otherCategory.id } });
  });
});

describe("checkSize", () => {
  it("is OK within a configured range", async () => {
    const result = await checkSize(categoryId, "Motorised", 1800, 2000);
    expect(result.status).toBe("OK");
  });

  it("is OUTSIDE_RANGE beyond a configured max", async () => {
    const result = await checkSize(categoryId, "Motorised", 2500, 2000);
    expect(result.status).toBe("OUTSIDE_RANGE");
  });

  it("is NO_DATA for a system with no rule configured", async () => {
    const result = await checkSize(categoryId, "Manual", 1000, 1000);
    expect(result.status).toBe("NO_DATA");
  });
});

describe("calculateLine", () => {
  it("applies discount, VAT and mode multiplier for a NEGOTIATED_DISCOUNT supplier (Decora)", () => {
    const result = calculateLine({
      listPriceExVat: new Prisma.Decimal("100.00"),
      discountPercent: new Prisma.Decimal("50.00"),
      supplierPricingType: SupplierPricingType.NEGOTIATED_DISCOUNT,
      vatPercent: new Prisma.Decimal("20"),
      modeMultiplier: new Prisma.Decimal("1.0000"),
      quantity: 2,
    });
    // cost = 100 * (1 - 0.5) = 50; incVat = 50 * 1.2 = 60; total = 120
    expect(result.solaraCostExVat.toString()).toBe("50");
    expect(result.unitPriceIncVat.toString()).toBe("60");
    expect(result.lineTotalIncVat.toString()).toBe("120");
  });

  it("ignores discount entirely for a FIXED_PRICE supplier (Beverley), even if a rate is passed in", () => {
    const result = calculateLine({
      listPriceExVat: new Prisma.Decimal("100.00"),
      discountPercent: new Prisma.Decimal("50.00"), // should be ignored
      supplierPricingType: SupplierPricingType.FIXED_PRICE,
      vatPercent: new Prisma.Decimal("20"),
      modeMultiplier: new Prisma.Decimal("1.0000"),
      quantity: 1,
    });
    // cost = 100 (list price directly, no discount); incVat = 100 * 1.2 = 120
    expect(result.solaraCostExVat.toString()).toBe("100");
    expect(result.unitPriceIncVat.toString()).toBe("120");
  });
});

describe("calculateDepositSplit", () => {
  it("splits total into deposit + balance", () => {
    const { deposit, balance } = calculateDepositSplit(new Prisma.Decimal("1000.00"), new Prisma.Decimal("30"));
    expect(deposit.toString()).toBe("300");
    expect(balance.toString()).toBe("700");
  });
});
