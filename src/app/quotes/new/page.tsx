import { getActiveSuppliers, getCategoriesForSupplier } from "@/lib/queries";
import { QuoteBuilderClient } from "./QuoteBuilderClient";

// Reads live pricing data — don't require DB access at build time (the
// build environment's DB may not be migrated yet).
export const dynamic = "force-dynamic";

export default async function NewQuotePage() {
  const suppliers = await getActiveSuppliers();
  const firstSupplier = suppliers[0];
  const initialCategories = firstSupplier ? await getCategoriesForSupplier(firstSupplier.id) : [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New Quote</h1>
      <QuoteBuilderClient
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name, code: s.code, pricingType: s.pricingType }))}
        initialCategories={initialCategories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
