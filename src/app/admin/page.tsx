import Link from "next/link";

const CARDS = [
  { href: "/admin/import", title: "Import Data", description: "Upload CSV exports: fabrics, colours, band mappings, price lists, discounts, max sizes." },
  { href: "/admin/settings", title: "Settings", description: "VAT % and Premium/Negotiation margin multipliers." },
  { href: "/admin/catalogue", title: "Catalogue", description: "Browse suppliers, categories, fabrics and configured pricing data." },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-lg border border-black/10 dark:border-white/15 p-5 hover:border-black/30 dark:hover:border-white/40 transition-colors"
          >
            <h2 className="font-medium">{c.title}</h2>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
