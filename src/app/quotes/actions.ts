"use server";

import { Brand, Prisma, SizeCheckStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveQuoteLine, RawLineInput } from "@/lib/quote-line-resolution";
import { revalidatePath } from "next/cache";

export async function previewQuoteLine(input: RawLineInput) {
  return resolveQuoteLine(input);
}

const BRAND_PREFIX: Record<Brand, string> = {
  SOLARA_SHADES: "SOL",
  BLINDS_KINGDOM: "BK",
};

async function nextQuoteNumber(brand: Brand): Promise<string> {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, "");
  const startOfDay = new Date(today.toISOString().slice(0, 10));
  const count = await prisma.quote.count({
    where: { brand, createdAt: { gte: startOfDay } },
  });
  return `${BRAND_PREFIX[brand]}-${datePart}-${String(count + 1).padStart(3, "0")}`;
}

export interface CreateQuoteInput {
  brand: Brand;
  customerId?: string | null;
  depositPercent: number;
  notes?: string;
  lines: RawLineInput[];
}

export async function createQuote(input: CreateQuoteInput): Promise<
  { ok: true; quoteId: string } | { ok: false; error: string }
> {
  if (input.lines.length === 0) return { ok: false, error: "Add at least one line before saving." };
  if (input.depositPercent < 0 || input.depositPercent > 100) {
    return { ok: false, error: "Deposit % must be between 0 and 100." };
  }

  // Recompute every line authoritatively — never trust client-provided totals.
  const resolved = await Promise.all(input.lines.map((l) => resolveQuoteLine(l)));
  const failures = resolved.filter((r) => !r.ok);
  if (failures.length > 0) {
    return { ok: false, error: `${failures.length} line(s) could not be resolved. Re-check selections.` };
  }

  const quoteNumber = await nextQuoteNumber(input.brand);

  const quote = await prisma.$transaction(async (tx) => {
    const created = await tx.quote.create({
      data: {
        quoteNumber,
        brand: input.brand,
        customerId: input.customerId || null,
        depositPercent: new Prisma.Decimal(input.depositPercent),
        notes: input.notes || null,
      },
    });

    for (let i = 0; i < input.lines.length; i++) {
      const raw = input.lines[i];
      const line = resolved[i];
      if (!line.ok) continue; // unreachable, guarded above

      await tx.quoteLine.create({
        data: {
          quoteId: created.id,
          supplierId: raw.supplierId,
          categoryId: raw.categoryId,
          fabricId: raw.fabricId,
          colourId: raw.colourId || null,
          band: line.band,
          priceTableRef: line.priceTableRef,
          system: raw.system,
          widthMm: raw.widthMm,
          dropMm: raw.dropMm,
          quantity: raw.quantity,
          pricingMode: raw.pricingMode,
          listPriceExVat: new Prisma.Decimal(line.listPriceExVat),
          discountPercent: new Prisma.Decimal(line.discountPercent),
          solaraCostExVat: new Prisma.Decimal(line.solaraCostExVat),
          vatPercent: new Prisma.Decimal(line.vatPercent),
          modeMultiplier: new Prisma.Decimal(line.modeMultiplier),
          unitPriceIncVat: new Prisma.Decimal(line.unitPriceIncVat),
          lineTotalIncVat: new Prisma.Decimal(line.lineTotalIncVat),
          sizeCheckStatus: line.sizeCheckStatus as SizeCheckStatus,
          sizeCheckNote: line.sizeCheckNote,
        },
      });
    }

    return created;
  });

  revalidatePath("/quotes");
  return { ok: true, quoteId: quote.id };
}

export async function deleteQuote(id: string) {
  await prisma.quote.delete({ where: { id } });
  revalidatePath("/quotes");
}
