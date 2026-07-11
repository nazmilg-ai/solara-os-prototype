import { Prisma, PricingMode, SupplierPricingType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  calculateLine,
  checkSize,
  resolveBand,
  resolveDiscountPercent,
  resolvePrice,
  getPricingModeMultiplier,
  VAT_PERCENT_DEFAULT,
} from "@/lib/pricing";

export interface RawLineInput {
  supplierId: string;
  categoryId: string;
  fabricId: string;
  colourId?: string | null;
  system: string;
  widthMm: number;
  dropMm: number;
  quantity: number;
  pricingMode: PricingMode;
}

export type ResolvedLine = {
  ok: true;
  band: string;
  listPriceExVat: string;
  discountPercent: string;
  discountSource: "category" | "default" | "none";
  solaraCostExVat: string;
  vatPercent: string;
  modeMultiplier: string;
  unitPriceIncVat: string;
  lineTotalIncVat: string;
  sizeCheckStatus: string;
  sizeCheckNote: string;
};

export type UnresolvedLine =
  | { ok: false; stage: "band"; issue: "not_found" }
  | { ok: false; stage: "band"; issue: "multiple"; candidates: string[] }
  | { ok: false; stage: "price"; issue: "not_found"; band: string }
  | {
      ok: false;
      stage: "price";
      issue: "multiple";
      band: string;
      candidates: { listPriceExVat: string; widthFromMm: number; widthToMm: number; dropFromMm: number; dropToMm: number }[];
    }
  | { ok: false; stage: "input"; issue: string };

export type LineResolution = ResolvedLine | UnresolvedLine;

/**
 * Runs the full Category+Fabric -> Band -> Price -> Discount -> VAT/margin ->
 * size-check pipeline for one line. Used by both the live preview in the
 * quote builder and the authoritative recompute on save, so the two can
 * never drift apart.
 */
export async function resolveQuoteLine(input: RawLineInput): Promise<LineResolution> {
  const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId } });
  if (!supplier) return { ok: false, stage: "input", issue: "Unknown supplier" };
  if (!supplier.active) return { ok: false, stage: "input", issue: "Supplier is not yet integrated" };

  if (input.widthMm <= 0 || input.dropMm <= 0) {
    return { ok: false, stage: "input", issue: "Width and drop must be positive" };
  }
  if (input.quantity <= 0 || !Number.isInteger(input.quantity)) {
    return { ok: false, stage: "input", issue: "Quantity must be a positive whole number" };
  }

  const bandResult = await resolveBand(input.supplierId, input.categoryId, input.fabricId);
  if (bandResult.status === "not_found") return { ok: false, stage: "band", issue: "not_found" };
  if (bandResult.status === "multiple") {
    return { ok: false, stage: "band", issue: "multiple", candidates: bandResult.candidates.map((c) => c.band) };
  }
  const band = bandResult.value.band;

  const priceResult = await resolvePrice(input.supplierId, input.categoryId, band, input.widthMm, input.dropMm);
  if (priceResult.status === "not_found") return { ok: false, stage: "price", issue: "not_found", band };
  if (priceResult.status === "multiple") {
    return {
      ok: false,
      stage: "price",
      issue: "multiple",
      band,
      candidates: priceResult.candidates.map((c) => ({
        listPriceExVat: c.listPriceExVat.toString(),
        widthFromMm: c.widthFromMm,
        widthToMm: c.widthToMm,
        dropFromMm: c.dropFromMm,
        dropToMm: c.dropToMm,
      })),
    };
  }
  const listPriceExVat = priceResult.value.listPriceExVat;

  const isFixedPrice = supplier.pricingType === SupplierPricingType.FIXED_PRICE;
  const { discountPercent, source: discountSource } = isFixedPrice
    ? { discountPercent: new Prisma.Decimal(0), source: "none" as const }
    : await resolveDiscountPercent(input.supplierId, input.categoryId);

  const vatSetting = await prisma.appSetting.findUnique({ where: { key: "vatPercent" } });
  const vatPercent = vatSetting ? new Prisma.Decimal(vatSetting.value) : VAT_PERCENT_DEFAULT;

  const modeMultiplier = await getPricingModeMultiplier(input.pricingMode);

  const { solaraCostExVat, unitPriceIncVat, lineTotalIncVat } = calculateLine({
    listPriceExVat,
    discountPercent,
    supplierPricingType: supplier.pricingType,
    vatPercent,
    modeMultiplier,
    quantity: input.quantity,
  });

  const sizeCheck = await checkSize(input.categoryId, input.system, input.widthMm, input.dropMm);

  return {
    ok: true,
    band,
    listPriceExVat: listPriceExVat.toString(),
    discountPercent: discountPercent.toString(),
    discountSource,
    solaraCostExVat: solaraCostExVat.toString(),
    vatPercent: vatPercent.toString(),
    modeMultiplier: modeMultiplier.toString(),
    unitPriceIncVat: unitPriceIncVat.toString(),
    lineTotalIncVat: lineTotalIncVat.toString(),
    sizeCheckStatus: sizeCheck.status,
    sizeCheckNote: sizeCheck.note,
  };
}
