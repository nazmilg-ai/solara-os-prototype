"use server";

import { Prisma, PricingMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateSettings(input: {
  vatPercent: number;
  premiumMultiplier: number;
  negotiationMultiplier: number;
}) {
  if ([input.vatPercent, input.premiumMultiplier, input.negotiationMultiplier].some((n) => Number.isNaN(n) || n < 0)) {
    return { ok: false as const, error: "All values must be non-negative numbers." };
  }

  await prisma.appSetting.upsert({
    where: { key: "vatPercent" },
    update: { value: String(input.vatPercent) },
    create: { key: "vatPercent", value: String(input.vatPercent) },
  });

  await prisma.pricingModeRate.upsert({
    where: { mode: PricingMode.PREMIUM },
    update: { multiplier: new Prisma.Decimal(input.premiumMultiplier) },
    create: { mode: PricingMode.PREMIUM, multiplier: new Prisma.Decimal(input.premiumMultiplier) },
  });

  await prisma.pricingModeRate.upsert({
    where: { mode: PricingMode.NEGOTIATION },
    update: { multiplier: new Prisma.Decimal(input.negotiationMultiplier) },
    create: { mode: PricingMode.NEGOTIATION, multiplier: new Prisma.Decimal(input.negotiationMultiplier) },
  });

  revalidatePath("/admin/settings");
  return { ok: true as const };
}
