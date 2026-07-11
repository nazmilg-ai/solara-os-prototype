"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBrand } from "@/lib/brand-context";
import { BRAND_LABELS, BrandValue } from "@/lib/brand";

const LINKS = [
  { href: "/quotes/new", label: "New Quote" },
  { href: "/quotes", label: "Quotes" },
  { href: "/customers", label: "Customers" },
  { href: "/admin", label: "Admin" },
];

export function NavHeader() {
  const pathname = usePathname();
  const { brand, setBrand } = useBrand();

  return (
    <header className="border-b border-black/10 dark:border-white/15">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-6">
        <Link href="/" className="font-semibold tracking-tight text-lg">
          Solara Pricing Engine
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href))
                  ? "font-medium underline underline-offset-4"
                  : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <label htmlFor="brand-select" className="text-black/50 dark:text-white/50">
            Brand
          </label>
          <select
            id="brand-select"
            value={brand}
            onChange={(e) => setBrand(e.target.value as BrandValue)}
            className="rounded border border-black/15 dark:border-white/20 bg-transparent px-2 py-1"
          >
            {Object.entries(BRAND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
