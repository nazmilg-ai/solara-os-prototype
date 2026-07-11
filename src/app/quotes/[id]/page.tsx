import { notFound } from "next/navigation";
import { getQuote } from "@/lib/queries";
import { BRAND_LABELS } from "@/lib/brand";
import { DeleteQuoteButton } from "./DeleteQuoteButton";

function money(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });
}

const SIZE_LABELS: Record<string, string> = {
  OK: "OK",
  OUTSIDE_RANGE: "Outside size range — check mechanism",
  NO_DATA: "No size data — verify manually",
};

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) notFound();

  const grandTotal = quote.lines.reduce((sum, l) => sum + parseFloat(l.lineTotalIncVat.toString()), 0);
  const depositPercent = parseFloat(quote.depositPercent.toString());
  const deposit = (grandTotal * depositPercent) / 100;
  const balance = grandTotal - deposit;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{quote.quoteNumber}</h1>
          <p className="text-black/60 dark:text-white/60 text-sm">
            {BRAND_LABELS[quote.brand]} · {quote.status} · Created {quote.createdAt.toLocaleDateString("en-GB")}
          </p>
        </div>
        <DeleteQuoteButton id={quote.id} />
      </div>

      <div className="rounded-lg border border-black/10 dark:border-white/15 p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-black/50 dark:text-white/50">Customer</div>
          <div className="font-medium">
            {quote.customer ? `${quote.customer.firstName} ${quote.customer.lastName}` : "—"}
          </div>
        </div>
        <div>
          <div className="text-black/50 dark:text-white/50">Deposit %</div>
          <div className="font-medium">{depositPercent}%</div>
        </div>
        {quote.notes && (
          <div className="col-span-2">
            <div className="text-black/50 dark:text-white/50">Notes</div>
            <div className="font-medium">{quote.notes}</div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-black/10 dark:border-white/15 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/5 text-left">
            <tr>
              <th className="p-2">Supplier</th>
              <th className="p-2">Category</th>
              <th className="p-2">Fabric</th>
              <th className="p-2">Colour</th>
              <th className="p-2">Band</th>
              <th className="p-2">W×D (mm)</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Mode</th>
              <th className="p-2">Unit inc VAT</th>
              <th className="p-2">Line Total</th>
              <th className="p-2">Size check</th>
            </tr>
          </thead>
          <tbody>
            {quote.lines.map((l) => (
              <tr key={l.id} className="border-t border-black/10 dark:border-white/10">
                <td className="p-2">{l.supplier.name}</td>
                <td className="p-2">{l.category.name}</td>
                <td className="p-2">{l.fabric.name}</td>
                <td className="p-2">{l.colour?.name ?? "—"}</td>
                <td className="p-2">{l.band}</td>
                <td className="p-2">
                  {l.widthMm}×{l.dropMm}
                </td>
                <td className="p-2">{l.quantity}</td>
                <td className="p-2">{l.pricingMode}</td>
                <td className="p-2">{money(l.unitPriceIncVat.toString())}</td>
                <td className="p-2">{money(l.lineTotalIncVat.toString())}</td>
                <td className="p-2">{SIZE_LABELS[l.sizeCheckStatus]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-black/10 dark:border-white/15 p-5 flex flex-wrap gap-6 text-sm">
        <div>
          <div className="text-black/50 dark:text-white/50">Grand Total (inc VAT)</div>
          <div className="text-lg font-semibold">{money(grandTotal)}</div>
        </div>
        <div>
          <div className="text-black/50 dark:text-white/50">Deposit</div>
          <div className="text-lg font-semibold">{money(deposit)}</div>
        </div>
        <div>
          <div className="text-black/50 dark:text-white/50">Balance</div>
          <div className="text-lg font-semibold">{money(balance)}</div>
        </div>
      </div>
    </div>
  );
}
