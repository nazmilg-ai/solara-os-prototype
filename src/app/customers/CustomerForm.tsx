"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BRAND_LABELS, BrandValue } from "@/lib/brand";
import { createCustomer, updateCustomer, CustomerInput } from "./actions";

export function CustomerForm({
  mode,
  customerId,
  initial,
}: {
  mode: "create" | "edit";
  customerId?: string;
  initial?: Partial<CustomerInput>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerInput>({
    accountNo: initial?.accountNo ?? "",
    brand: (initial?.brand as BrandValue) ?? "SOLARA_SHADES",
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    doorNo: initial?.doorNo ?? "",
    addressLine1: initial?.addressLine1 ?? "",
    addressLine2: initial?.addressLine2 ?? "",
    city: initial?.city ?? "",
    county: initial?.county ?? "",
    postcode: initial?.postcode ?? "",
    telephoneNumber: initial?.telephoneNumber ?? "",
    mobileNumber: initial?.mobileNumber ?? "",
    email: initial?.email ?? "",
    dateRegistered: initial?.dateRegistered ?? new Date().toISOString().slice(0, 10),
    notes: initial?.notes ?? "",
  });

  function set<K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create" ? await createCustomer(form) : await updateCustomer(customerId!, form);
      if (result.ok) {
        router.push("/customers");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Account No">
          <input className="input" value={form.accountNo} onChange={(e) => set("accountNo", e.target.value)} required />
        </Field>
        <Field label="Brand">
          <select className="input" value={form.brand} onChange={(e) => set("brand", e.target.value as BrandValue)}>
            {Object.entries(BRAND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="First Name">
          <input className="input" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required />
        </Field>
        <Field label="Last Name">
          <input className="input" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
        </Field>
        <Field label="Door No">
          <input className="input" value={form.doorNo} onChange={(e) => set("doorNo", e.target.value)} />
        </Field>
        <Field label="Address Line 1">
          <input className="input" value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} />
        </Field>
        <Field label="Address Line 2">
          <input className="input" value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} />
        </Field>
        <Field label="City">
          <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} />
        </Field>
        <Field label="County">
          <input className="input" value={form.county} onChange={(e) => set("county", e.target.value)} />
        </Field>
        <Field label="Postcode">
          <input className="input" value={form.postcode} onChange={(e) => set("postcode", e.target.value)} />
        </Field>
        <Field label="Telephone Number">
          <input className="input" value={form.telephoneNumber} onChange={(e) => set("telephoneNumber", e.target.value)} />
        </Field>
        <Field label="Mobile Number">
          <input className="input" value={form.mobileNumber} onChange={(e) => set("mobileNumber", e.target.value)} />
        </Field>
        <Field label="Email">
          <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Date Registered">
          <input
            className="input"
            type="date"
            value={form.dateRegistered}
            onChange={(e) => set("dateRegistered", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Notes">
        <textarea className="input" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button className="btn-primary" type="submit" disabled={isPending}>
          {mode === "create" ? "Create Customer" : "Save Changes"}
        </button>
        <button
          type="button"
          className="text-sm text-black/60 dark:text-white/60 hover:underline"
          onClick={() => router.push("/customers")}
        >
          Cancel
        </button>
      </div>
    </form>
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
