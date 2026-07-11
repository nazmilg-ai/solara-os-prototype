import { getActiveSuppliers, getCategories } from "@/lib/queries";
import { QuoteBuilderClient } from "./QuoteBuilderClient";

export default async function NewQuotePage() {
  const [suppliers, categories] = await Promise.all([getActiveSuppliers(), getCategories()]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New Quote</h1>
      <QuoteBuilderClient
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name, code: s.code, pricingType: s.pricingType }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
