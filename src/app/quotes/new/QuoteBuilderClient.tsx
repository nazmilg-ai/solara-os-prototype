"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useBrand } from "@/lib/brand-context";
import { fetchCategoriesForSupplier, fetchColours, fetchCustomers, fetchFabrics } from "./data-actions";
import { previewQuoteLine, createQuote } from "@/app/quotes/actions";
import type { RawLineInput, LineResolution, ResolvedLine } from "@/lib/quote-line-resolution";

type Option = { id: string; name: string };
type Supplier = { id: string; name: string; code: string; pricingType: string };
type Category = { id: string; name: string };

type CartLine = RawLineInput & {
  localId: string;
  resolved: ResolvedLine;
  supplierName: string;
  categoryName: string;
  fabricName: string;
  colourName: string | null;
};

const PRICING_MODES: { value: "PREMIUM" | "NEGOTIATION"; label: string }[] = [
  { value: "PREMIUM", label: "Premium" },
  { value: "NEGOTIATION", label: "Negotiation" },
];

function money(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });
}

function SizeCheckBadge({ status, note }: { status: string; note: string }) {
  const styles: Record<string, string> = {
    OK: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    OUTSIDE_RANGE: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    NO_DATA: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };
  const labels: Record<string, string> = {
    OK: "OK",
    OUTSIDE_RANGE: "Outside size range — check mechanism",
    NO_DATA: "No size data — verify manually",
  };
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${styles[status] ?? ""}`} title={note}>
      {labels[status] ?? status}
    </span>
  );
}

export function QuoteBuilderClient({
  suppliers,
  initialCategories,
  defaultDepositPercent,
}: {
  suppliers: Supplier[];
  initialCategories: Category[];
  defaultDepositPercent: string;
}) {
  const router = useRouter();
  const { brand } = useBrand();
  const [isPending, startTransition] = useTransition();

  // Line draft fields
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [categoryId, setCategoryId] = useState("");
  const [fabricId, setFabricId] = useState("");
  const [colourId, setColourId] = useState("");
  const [system, setSystem] = useState("");
  const [widthMm, setWidthMm] = useState("");
  const [dropMm, setDropMm] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [pricingMode, setPricingMode] = useState<"PREMIUM" | "NEGOTIATION">("PREMIUM");

  const [fabrics, setFabrics] = useState<Option[]>([]);
  const [colours, setColours] = useState<Option[]>([]);
  const [preview, setPreview] = useState<LineResolution | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [lines, setLines] = useState<CartLine[]>([]);
  const [customers, setCustomers] = useState<{ id: string; accountNo: string; name: string }[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [depositPercent, setDepositPercent] = useState(defaultDepositPercent);
  const [notes, setNotes] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    // Reacting to `brand`, which is owned by a sibling component (the header
    // brand switcher) — there's no local event handler to hook this into.
    fetchCustomers(brand).then(setCustomers);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustomerId("");
  }, [brand]);

  function handleSupplierChange(value: string) {
    setSupplierId(value);
    setCategoryId("");
    setFabricId("");
    setFabrics([]);
    setColours([]);
    setColourId("");
    setPreview(null);
    fetchCategoriesForSupplier(value).then(setCategories);
  }

  function handleCategoryChange(value: string) {
    setCategoryId(value);
    setFabricId("");
    setColours([]);
    setColourId("");
    setPreview(null);
    if (!value) {
      setFabrics([]);
      return;
    }
    fetchFabrics(value).then(setFabrics);
    // Colour is informational only and scoped to the category (not the
    // specific fabric) — the real colour data has no reliable per-fabric link.
    fetchColours(value).then(setColours);
  }

  function handleFabricChange(value: string) {
    setFabricId(value);
    setPreview(null);
  }

  const currentSupplier = suppliers.find((s) => s.id === supplierId);
  const currentCategory = categories.find((c) => c.id === categoryId);
  const currentFabric = fabrics.find((f) => f.id === fabricId);
  const currentColour = colours.find((c) => c.id === colourId);

  // System/Mechanism is optional — it only feeds the size check, which
  // already handles "no data" honestly when it's blank or unmatched. Most
  // categories don't have max-size data yet anyway (see Max_Size_Master.csv).
  const canPreview = supplierId && categoryId && fabricId && widthMm && dropMm && quantity;

  function runPreview() {
    setPreviewError(null);
    setPreview(null);
    const input: RawLineInput = {
      supplierId,
      categoryId,
      fabricId,
      colourId: colourId || null,
      system: system.trim(),
      widthMm: Number(widthMm),
      dropMm: Number(dropMm),
      quantity: Number(quantity),
      pricingMode,
    };
    startTransition(async () => {
      try {
        const result = await previewQuoteLine(input);
        setPreview(result);
      } catch {
        setPreviewError("Lookup failed — please try again.");
      }
    });
  }

  function addLine() {
    if (!preview || !preview.ok || !currentSupplier || !currentCategory || !currentFabric) return;
    const line: CartLine = {
      localId: crypto.randomUUID(),
      supplierId,
      categoryId,
      fabricId,
      colourId: colourId || null,
      system: system.trim(),
      widthMm: Number(widthMm),
      dropMm: Number(dropMm),
      quantity: Number(quantity),
      pricingMode,
      resolved: preview,
      supplierName: currentSupplier.name,
      categoryName: currentCategory.name,
      fabricName: currentFabric.name,
      colourName: currentColour?.name ?? null,
    };
    setLines((prev) => [...prev, line]);
    // Reset the line draft for the next item, keep supplier for convenience.
    setCategoryId("");
    setSystem("");
    setWidthMm("");
    setDropMm("");
    setQuantity("1");
    setPreview(null);
  }

  function removeLine(localId: string) {
    setLines((prev) => prev.filter((l) => l.localId !== localId));
  }

  const grandTotal = useMemo(
    () => lines.reduce((sum, l) => sum + parseFloat(l.resolved.lineTotalIncVat), 0),
    [lines]
  );
  const depositAmount = useMemo(
    () => (grandTotal * Number(depositPercent || "0")) / 100,
    [grandTotal, depositPercent]
  );
  const balanceAmount = grandTotal - depositAmount;

  function handleSaveQuote() {
    setSaveError(null);
    if (lines.length === 0) {
      setSaveError("Add at least one line before saving.");
      return;
    }
    startTransition(async () => {
      const result = await createQuote({
        brand,
        customerId: customerId || null,
        depositPercent: Number(depositPercent || "0"),
        notes: notes || undefined,
        lines: lines.map(
          (l): RawLineInput => ({
            supplierId: l.supplierId,
            categoryId: l.categoryId,
            fabricId: l.fabricId,
            colourId: l.colourId,
            system: l.system,
            widthMm: l.widthMm,
            dropMm: l.dropMm,
            quantity: l.quantity,
            pricingMode: l.pricingMode,
          })
        ),
      });
      if (result.ok) {
        router.push(`/quotes/${result.quoteId}`);
      } else {
        setSaveError(result.error);
      }
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-black/10 dark:border-white/15 p-5 space-y-4">
        <h2 className="font-medium">Add a line item</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Supplier">
            <select className="input" value={supplierId} onChange={(e) => handleSupplierChange(e.target.value)}>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Product Category">
            <select className="input" value={categoryId} onChange={(e) => handleCategoryChange(e.target.value)}>
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fabric / Item Name">
            <select
              className="input"
              value={fabricId}
              onChange={(e) => handleFabricChange(e.target.value)}
              disabled={!categoryId}
            >
              <option value="">{categoryId ? "Select fabric…" : "Select a category first"}</option>
              {fabrics.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            {categoryId && fabrics.length === 0 && (
              <p className="text-xs text-black/50 dark:text-white/50 mt-1">No fabrics loaded for this category yet.</p>
            )}
          </Field>
          <Field label="Colour (optional)">
            <select className="input" value={colourId} onChange={(e) => setColourId(e.target.value)} disabled={!categoryId}>
              <option value="">
                {categoryId ? (colours.length ? "Select colour…" : "No colour data for this category") : "Select a category first"}
              </option>
              {colours.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="System / Mechanism (optional)">
            <input
              className="input"
              placeholder="e.g. Manual, Motorised — leave blank to skip the size check"
              value={system}
              onChange={(e) => setSystem(e.target.value)}
            />
          </Field>
          <Field label="Pricing Mode">
            <select className="input" value={pricingMode} onChange={(e) => setPricingMode(e.target.value as "PREMIUM" | "NEGOTIATION")}>
              {PRICING_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Width (mm)">
            <input className="input" type="number" min={1} value={widthMm} onChange={(e) => setWidthMm(e.target.value)} />
          </Field>
          <Field label="Drop (mm)">
            <input className="input" type="number" min={1} value={dropMm} onChange={(e) => setDropMm(e.target.value)} />
          </Field>
          <Field label="Quantity">
            <input className="input" type="number" min={1} step={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </Field>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={!canPreview || isPending} onClick={runPreview}>
            Check price
          </button>
          {previewError && <span className="text-sm text-red-600">{previewError}</span>}
        </div>

        {preview && <PreviewPanel preview={preview} onAdd={addLine} />}
      </section>

      {lines.length > 0 && (
        <section className="rounded-lg border border-black/10 dark:border-white/15 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/5 text-left">
              <tr>
                <th className="p-2">Supplier</th>
                <th className="p-2">Category</th>
                <th className="p-2">Fabric</th>
                <th className="p-2">Colour</th>
                <th className="p-2">W×D (mm)</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Mode</th>
                <th className="p-2">Unit inc VAT</th>
                <th className="p-2">Line Total</th>
                <th className="p-2">Size check</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.localId} className="border-t border-black/10 dark:border-white/10">
                  <td className="p-2">{l.supplierName}</td>
                  <td className="p-2">{l.categoryName}</td>
                  <td className="p-2">{l.fabricName}</td>
                  <td className="p-2">{l.colourName ?? "—"}</td>
                  <td className="p-2">
                    {l.widthMm}×{l.dropMm}
                  </td>
                  <td className="p-2">{l.quantity}</td>
                  <td className="p-2">{l.pricingMode}</td>
                  <td className="p-2">{money(l.resolved.unitPriceIncVat)}</td>
                  <td className="p-2">{money(l.resolved.lineTotalIncVat)}</td>
                  <td className="p-2">
                    <SizeCheckBadge status={l.resolved.sizeCheckStatus} note={l.resolved.sizeCheckNote} />
                  </td>
                  <td className="p-2">
                    <button className="text-red-600 hover:underline" onClick={() => removeLine(l.localId)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="rounded-lg border border-black/10 dark:border-white/15 p-5 space-y-4">
        <h2 className="font-medium">Quote details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Customer (optional)">
            <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">No customer selected</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.accountNo} — {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Deposit %">
            <input
              className="input"
              type="number"
              min={0}
              max={100}
              value={depositPercent}
              onChange={(e) => setDepositPercent(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Notes">
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        <div className="flex flex-wrap items-center gap-6 text-sm border-t border-black/10 dark:border-white/10 pt-4">
          <div>
            <div className="text-black/50 dark:text-white/50">Grand Total (inc VAT)</div>
            <div className="text-lg font-semibold">{money(grandTotal)}</div>
          </div>
          <div>
            <div className="text-black/50 dark:text-white/50">Deposit</div>
            <div className="text-lg font-semibold">{money(depositAmount)}</div>
          </div>
          <div>
            <div className="text-black/50 dark:text-white/50">Balance</div>
            <div className="text-lg font-semibold">{money(balanceAmount)}</div>
          </div>
          <button className="btn-primary ml-auto" onClick={handleSaveQuote} disabled={isPending}>
            Save Quote
          </button>
        </div>
        {saveError && <p className="text-sm text-red-600">{saveError}</p>}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="block mb-1 text-black/60 dark:text-white/60">{label}</span>
      {children}
    </label>
  );
}

function PreviewPanel({ preview, onAdd }: { preview: LineResolution; onAdd: () => void }) {
  if (preview.ok) {
    return (
      <div className="rounded border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4 space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <Info label="Band" value={preview.band} />
          <Info label="List price ex VAT" value={money(preview.listPriceExVat)} />
          <Info
            label="Discount"
            value={`${preview.discountPercent}% (${preview.discountSource === "none" ? "no discount / fixed price" : preview.discountSource})`}
          />
          <Info label="Solara cost ex VAT" value={money(preview.solaraCostExVat)} />
          <Info label="VAT" value={`${preview.vatPercent}%`} />
          <Info label="Mode multiplier" value={preview.modeMultiplier} />
          <Info label="Unit price inc VAT" value={money(preview.unitPriceIncVat)} />
          <Info label="Line total inc VAT" value={money(preview.lineTotalIncVat)} />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <SizeCheckBadge status={preview.sizeCheckStatus} note={preview.sizeCheckNote} />
          <button className="btn-primary" onClick={onAdd}>
            Add to quote
          </button>
        </div>
      </div>
    );
  }

  if (preview.stage === "band" && preview.issue === "not_found") {
    return <ErrorPanel text="Not found — no Category+Fabric band mapping for this supplier." />;
  }
  if (preview.stage === "band" && preview.issue === "multiple") {
    const candidateList = preview.candidates.map((c) => `${c.band} (${c.priceTableRef})`).join(", ");
    return <ErrorPanel text={`Multiple matches — refine selection. Candidates: ${candidateList}`} />;
  }
  if (preview.stage === "price" && preview.issue === "not_found") {
    return <ErrorPanel text={`Not found — band "${preview.band}" has no price row covering this width/drop.`} />;
  }
  if (preview.stage === "price" && preview.issue === "multiple") {
    return (
      <ErrorPanel
        text={`Multiple matches — refine selection. Band "${preview.band}" has ${preview.candidates.length} conflicting price rows for this width/drop.`}
      />
    );
  }
  return <ErrorPanel text={preview.issue} />;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-black/50 dark:text-white/50 text-xs">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function ErrorPanel({ text }: { text: string }) {
  return (
    <div className="rounded border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-800 dark:text-red-300">
      {text}
    </div>
  );
}
