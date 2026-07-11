"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { BrandValue } from "@/lib/brand";

const STORAGE_KEY = "solara-os.brand";

const BrandContext = createContext<{
  brand: BrandValue;
  setBrand: (b: BrandValue) => void;
} | null>(null);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrandState] = useState<BrandValue>("SOLARA_SHADES");

  useEffect(() => {
    // One-time sync from localStorage (an external system) on mount; the
    // default value above is what SSR renders, so this can't be done via a
    // lazy useState initializer without causing a hydration mismatch.
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "SOLARA_SHADES" || stored === "BLINDS_KINGDOM") setBrandState(stored);
  }, []);

  function setBrand(b: BrandValue) {
    setBrandState(b);
    window.localStorage.setItem(STORAGE_KEY, b);
  }

  return <BrandContext.Provider value={{ brand, setBrand }}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used within BrandProvider");
  return ctx;
}
