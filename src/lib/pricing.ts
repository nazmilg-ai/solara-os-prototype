import { Prisma, PricingMode, SizeCheckStatus, SupplierPricingType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type LookupResult<T> =
  | { status: "not_found" }
  | { status: "found"; value: T }
  | { status: "multiple"; candidates: T[] };

export interface BandMatch {
  mappingId: string;
  band: string;
}

/** Category + Fabric -> Band, scoped to one supplier. */
export async function resolveBand(
  supplierId: string,
  categoryId: string,
  fabricId: string
): Promise<LookupResult<BandMatch>> {
  const rows = await prisma.fabricBandMapping.findMany({
    where: { supplierId, categoryId, fabricId },
  });

  if (rows.length === 0) return { status: "not_found" };
  if (rows.length === 1) return { status: "found", value: { mappingId: rows[0].id, band: rows[0].band } };

  // Distinct bands only — if duplicate rows happen to agree on the band,
  // that's not a real ambiguity.
  const distinctBands = new Map(rows.map((r) => [r.band, r]));
  if (distinctBands.size === 1) {
    const row = rows[0];
    return { status: "found", value: { mappingId: row.id, band: row.band } };
  }
  return {
    status: "multiple",
    candidates: [...distinctBands.values()].map((r) => ({ mappingId: r.id, band: r.band })),
  };
}

export interface PriceMatch {
  priceRowId: string;
  band: string;
  listPriceExVat: Prisma.Decimal;
  widthFromMm: number;
  widthToMm: number;
  dropFromMm: number;
  dropToMm: number;
}

/** Category + Band + Width + Drop -> supplier list price ex VAT. */
export async function resolvePrice(
  supplierId: string,
  categoryId: string,
  band: string,
  widthMm: number,
  dropMm: number
): Promise<LookupResult<PriceMatch>> {
  const rows = await prisma.priceListRow.findMany({
    where: {
      supplierId,
      categoryId,
      band,
      widthFromMm: { lte: widthMm },
      widthToMm: { gte: widthMm },
      dropFromMm: { lte: dropMm },
      dropToMm: { gte: dropMm },
    },
  });

  if (rows.length === 0) return { status: "not_found" };
  if (rows.length === 1) {
    const r = rows[0];
    return {
      status: "found",
      value: {
        priceRowId: r.id,
        band: r.band,
        listPriceExVat: r.listPriceExVat,
        widthFromMm: r.widthFromMm,
        widthToMm: r.widthToMm,
        dropFromMm: r.dropFromMm,
        dropToMm: r.dropToMm,
      },
    };
  }

  // Distinct prices only — overlapping rows that happen to agree aren't a
  // real ambiguity.
  const distinctPrices = new Map(rows.map((r) => [r.listPriceExVat.toString(), r]));
  if (distinctPrices.size === 1) {
    const r = rows[0];
    return {
      status: "found",
      value: {
        priceRowId: r.id,
        band: r.band,
        listPriceExVat: r.listPriceExVat,
        widthFromMm: r.widthFromMm,
        widthToMm: r.widthToMm,
        dropFromMm: r.dropFromMm,
        dropToMm: r.dropToMm,
      },
    };
  }
  return {
    status: "multiple",
    candidates: rows.map((r) => ({
      priceRowId: r.id,
      band: r.band,
      listPriceExVat: r.listPriceExVat,
      widthFromMm: r.widthFromMm,
      widthToMm: r.widthToMm,
      dropFromMm: r.dropFromMm,
      dropToMm: r.dropToMm,
    })),
  };
}

/**
 * Discount % for a supplier + category, falling back to the supplier's
 * default rate when no category-specific rate is configured. FIXED_PRICE
 * suppliers (Beverley) never have a discount consulted at all — callers
 * should check the supplier's pricingType first.
 */
export async function resolveDiscountPercent(
  supplierId: string,
  categoryId: string
): Promise<{ discountPercent: Prisma.Decimal; source: "category" | "default" | "none" }> {
  const specific = await prisma.discountRate.findUnique({
    where: { supplierId_categoryId: { supplierId, categoryId } },
  });
  if (specific) return { discountPercent: specific.discountPercent, source: "category" };

  const fallback = await prisma.discountRate.findFirst({
    where: { supplierId, categoryId: null, isDefault: true },
  });
  if (fallback) return { discountPercent: fallback.discountPercent, source: "default" };

  return { discountPercent: new Prisma.Decimal(0), source: "none" };
}

export interface SizeCheckResult {
  status: SizeCheckStatus;
  note: string;
}

/** Width/Drop vs the max-size table for a category + system/mechanism. */
export async function checkSize(
  categoryId: string,
  system: string,
  widthMm: number,
  dropMm: number
): Promise<SizeCheckResult> {
  const rule = await prisma.maxSizeRule.findUnique({
    where: { categoryId_system: { categoryId, system } },
  });

  if (!rule) {
    return { status: SizeCheckStatus.NO_DATA, note: "No size data — verify manually" };
  }

  const withinWidth =
    widthMm <= rule.maxWidthMm && (rule.minWidthMm == null || widthMm >= rule.minWidthMm);
  const withinDrop = dropMm <= rule.maxDropMm && (rule.minDropMm == null || dropMm >= rule.minDropMm);

  if (withinWidth && withinDrop) {
    return { status: SizeCheckStatus.OK, note: "Within size range" };
  }
  return { status: SizeCheckStatus.OUTSIDE_RANGE, note: "Outside size range — check mechanism" };
}

export const VAT_PERCENT_DEFAULT = new Prisma.Decimal(20);

export interface LineCalculation {
  solaraCostExVat: Prisma.Decimal;
  unitPriceIncVat: Prisma.Decimal;
  lineTotalIncVat: Prisma.Decimal;
}

/**
 * Cost + VAT + margin math for one quote line, once band/price/discount have
 * already been resolved unambiguously.
 */
export function calculateLine(params: {
  listPriceExVat: Prisma.Decimal;
  discountPercent: Prisma.Decimal;
  supplierPricingType: SupplierPricingType;
  vatPercent: Prisma.Decimal;
  modeMultiplier: Prisma.Decimal;
  quantity: number;
}): LineCalculation {
  const { listPriceExVat, discountPercent, supplierPricingType, vatPercent, modeMultiplier, quantity } =
    params;

  const solaraCostExVat =
    supplierPricingType === SupplierPricingType.FIXED_PRICE
      ? listPriceExVat
      : listPriceExVat.mul(new Prisma.Decimal(1).minus(discountPercent.div(100)));

  const unitPriceIncVat = solaraCostExVat
    .mul(new Prisma.Decimal(1).plus(vatPercent.div(100)))
    .mul(modeMultiplier);

  const lineTotalIncVat = unitPriceIncVat.mul(quantity);

  return { solaraCostExVat, unitPriceIncVat, lineTotalIncVat };
}

export interface DepositSplit {
  total: Prisma.Decimal;
  deposit: Prisma.Decimal;
  balance: Prisma.Decimal;
}

export function calculateDepositSplit(total: Prisma.Decimal, depositPercent: Prisma.Decimal): DepositSplit {
  const deposit = total.mul(depositPercent.div(100)).toDecimalPlaces(2);
  const balance = total.minus(deposit);
  return { total, deposit, balance };
}

export async function getPricingModeMultiplier(mode: PricingMode): Promise<Prisma.Decimal> {
  const row = await prisma.pricingModeRate.findUnique({ where: { mode } });
  if (!row) {
    throw new Error(
      `No PricingModeRate configured for ${mode}. Set one in Admin > Settings before quoting.`
    );
  }
  return row.multiplier;
}
