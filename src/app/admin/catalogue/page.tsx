import { prisma } from "@/lib/prisma";

// Live business data — never statically cache, and don't require DB access
// at build time (the build environment's DB may not be migrated yet).
export const dynamic = "force-dynamic";

export default async function CataloguePage() {
  const [suppliers, categories, discountRates, maxSizeRules] = await Promise.all([
    prisma.supplier.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { bandMappings: true, priceRows: true } } },
    }),
    prisma.productCategory.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { fabrics: true } } },
    }),
    prisma.discountRate.findMany({ include: { supplier: true, category: true }, orderBy: { supplierId: "asc" } }),
    prisma.maxSizeRule.findMany({ include: { category: true }, orderBy: { categoryId: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Catalogue</h1>

      <section className="space-y-2">
        <h2 className="font-medium">Suppliers</h2>
        <Table headers={["Name", "Code", "Pricing Type", "Credit Terms", "Active", "Band Mappings", "Price Rows"]}>
          {suppliers.map((s) => (
            <tr key={s.id} className="border-t border-black/10 dark:border-white/10">
              <td className="p-2">{s.name}</td>
              <td className="p-2">{s.code}</td>
              <td className="p-2">{s.pricingType}</td>
              <td className="p-2">{s.creditTerms ?? "—"}</td>
              <td className="p-2">{s.active ? "Yes" : "No"}</td>
              <td className="p-2">{s._count.bandMappings}</td>
              <td className="p-2">{s._count.priceRows}</td>
            </tr>
          ))}
        </Table>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Categories</h2>
        <Table headers={["Category", "Fabrics"]}>
          {categories.map((c) => (
            <tr key={c.id} className="border-t border-black/10 dark:border-white/10">
              <td className="p-2">{c.name}</td>
              <td className="p-2">{c._count.fabrics}</td>
            </tr>
          ))}
        </Table>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Discount Rates</h2>
        {discountRates.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">
            None configured yet — quote lines will show &quot;no discount data&quot; until imported.
          </p>
        ) : (
          <Table headers={["Supplier", "Category", "Discount %", "Default fallback"]}>
            {discountRates.map((d) => (
              <tr key={d.id} className="border-t border-black/10 dark:border-white/10">
                <td className="p-2">{d.supplier.name}</td>
                <td className="p-2">{d.category?.name ?? "—"}</td>
                <td className="p-2">{d.discountPercent.toString()}%</td>
                <td className="p-2">{d.isDefault ? "Yes" : "No"}</td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Max Size Rules</h2>
        {maxSizeRules.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">
            None configured yet — every size check will show &quot;No size data — verify manually&quot;.
          </p>
        ) : (
          <Table headers={["Category", "System", "Min W", "Max W", "Min D", "Max D"]}>
            {maxSizeRules.map((r) => (
              <tr key={r.id} className="border-t border-black/10 dark:border-white/10">
                <td className="p-2">{r.category.name}</td>
                <td className="p-2">{r.system}</td>
                <td className="p-2">{r.minWidthMm ?? "—"}</td>
                <td className="p-2">{r.maxWidthMm}</td>
                <td className="p-2">{r.minDropMm ?? "—"}</td>
                <td className="p-2">{r.maxDropMm}</td>
              </tr>
            ))}
          </Table>
        )}
      </section>
    </div>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/15 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-black/5 dark:bg-white/5 text-left">
          <tr>
            {headers.map((h) => (
              <th key={h} className="p-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
