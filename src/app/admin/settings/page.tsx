import { prisma } from "@/lib/prisma";
import { PricingMode } from "@prisma/client";
import { SettingsForm } from "./SettingsForm";

// Live business data — never statically cache, and don't require DB access
// at build time (the build environment's DB may not be migrated yet).
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [vatSetting, premiumRate, negotiationRate] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: "vatPercent" } }),
    prisma.pricingModeRate.findUnique({ where: { mode: PricingMode.PREMIUM } }),
    prisma.pricingModeRate.findUnique({ where: { mode: PricingMode.NEGOTIATION } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <SettingsForm
        vatPercent={vatSetting?.value ?? "20"}
        premiumMultiplier={premiumRate?.multiplier.toString() ?? "1.0000"}
        negotiationMultiplier={negotiationRate?.multiplier.toString() ?? "1.0000"}
      />
    </div>
  );
}
