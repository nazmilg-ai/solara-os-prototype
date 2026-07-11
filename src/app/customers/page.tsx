import Link from "next/link";
import { getCustomers } from "@/lib/queries";
import { BRAND_LABELS } from "@/lib/brand";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <Link href="/customers/new" className="btn-primary">
          New Customer
        </Link>
      </div>

      {customers.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">No customers yet.</p>
      ) : (
        <div className="rounded-lg border border-black/10 dark:border-white/15 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/5 text-left">
              <tr>
                <th className="p-2">Account No</th>
                <th className="p-2">Name</th>
                <th className="p-2">Brand</th>
                <th className="p-2">Phone</th>
                <th className="p-2">Email</th>
                <th className="p-2">Registered</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-t border-black/10 dark:border-white/10">
                  <td className="p-2">
                    <Link href={`/customers/${c.id}`} className="underline underline-offset-2">
                      {c.accountNo}
                    </Link>
                  </td>
                  <td className="p-2">
                    {c.firstName} {c.lastName}
                  </td>
                  <td className="p-2">{BRAND_LABELS[c.brand]}</td>
                  <td className="p-2">{c.phone ?? "—"}</td>
                  <td className="p-2">{c.email ?? "—"}</td>
                  <td className="p-2">{c.dateRegistered.toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
