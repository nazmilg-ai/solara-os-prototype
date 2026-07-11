import Link from "next/link";
import { getQuotes } from "@/lib/queries";
import { BRAND_LABELS } from "@/lib/brand";

// Live business data — never statically cache, and don't require DB access
// at build time (the build environment's DB may not be migrated yet).
export const dynamic = "force-dynamic";

function money(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });
}

export default async function QuotesPage() {
  const quotes = await getQuotes();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Quotes</h1>
        <Link href="/quotes/new" className="btn-primary">
          New Quote
        </Link>
      </div>

      {quotes.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">No quotes yet.</p>
      ) : (
        <div className="rounded-lg border border-black/10 dark:border-white/15 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/5 text-left">
              <tr>
                <th className="p-2">Quote #</th>
                <th className="p-2">Brand</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Lines</th>
                <th className="p-2">Total (inc VAT)</th>
                <th className="p-2">Status</th>
                <th className="p-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => {
                const total = q.lines.reduce((sum, l) => sum + parseFloat(l.lineTotalIncVat.toString()), 0);
                return (
                  <tr key={q.id} className="border-t border-black/10 dark:border-white/10">
                    <td className="p-2">
                      <Link href={`/quotes/${q.id}`} className="underline underline-offset-2">
                        {q.quoteNumber}
                      </Link>
                    </td>
                    <td className="p-2">{BRAND_LABELS[q.brand]}</td>
                    <td className="p-2">{q.customer ? `${q.customer.firstName} ${q.customer.lastName}` : "—"}</td>
                    <td className="p-2">{q.lines.length}</td>
                    <td className="p-2">{money(total)}</td>
                    <td className="p-2">{q.status}</td>
                    <td className="p-2">{q.createdAt.toLocaleDateString("en-GB")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
