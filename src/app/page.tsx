import Link from "next/link";

const CARDS = [
  {
    href: "/quotes/new",
    title: "New Quote",
    description: "Build a multi-line quote: category, fabric, colour, size, supplier lookup, deposit split.",
  },
  {
    href: "/quotes",
    title: "Quotes",
    description: "Browse saved quotes across both brands.",
  },
  {
    href: "/customers",
    title: "Customers",
    description: "Customer records — account no, contact details, notes.",
  },
  {
    href: "/admin",
    title: "Admin",
    description: "Import CSV pricing data and configure VAT / margin settings.",
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Solara Pricing Engine</h1>
        <p className="mt-1 text-black/60 dark:text-white/60 max-w-2xl">
          Prototype quote builder replacing the Excel pricing engine for Solara Shades and
          Blinds Kingdom. Pricing data (fabrics, bands, price tables, discounts, max sizes) is
          scaffolded and empty until imported via Admin &rarr; Import.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
