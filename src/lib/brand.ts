// Plain constants shared by Server and Client Components. Deliberately not
// in brand-context.tsx (which is "use client") — a Server Component can't
// safely read object exports from a client-boundary module.
export type BrandValue = "SOLARA_SHADES" | "BLINDS_KINGDOM";

export const BRAND_LABELS: Record<BrandValue, string> = {
  SOLARA_SHADES: "Solara Shades",
  BLINDS_KINGDOM: "Blinds Kingdom",
};
