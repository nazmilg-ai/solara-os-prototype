"use client";

import { useState, useTransition } from "react";
import { updateSettings } from "./actions";

export function SettingsForm({
  vatPercent,
  premiumMultiplier,
  negotiationMultiplier,
}: {
  vatPercent: string;
  premiumMultiplier: string;
  negotiationMultiplier: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [vat, setVat] = useState(vatPercent);
  const [premium, setPremium] = useState(premiumMultiplier);
  const [negotiation, setNegotiation] = useState(negotiationMultiplier);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateSettings({
        vatPercent: Number(vat),
        premiumMultiplier: Number(premium),
        negotiationMultiplier: Number(negotiation),
      });
      if (result.ok) setMessage("Settings saved.");
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <label className="block text-sm">
        <span className="block mb-1 text-black/60 dark:text-white/60">VAT %</span>
        <input className="input" type="number" step="0.01" value={vat} onChange={(e) => setVat(e.target.value)} />
      </label>
      <label className="block text-sm">
        <span className="block mb-1 text-black/60 dark:text-white/60">Premium mode multiplier</span>
        <input className="input" type="number" step="0.0001" value={premium} onChange={(e) => setPremium(e.target.value)} />
      </label>
      <label className="block text-sm">
        <span className="block mb-1 text-black/60 dark:text-white/60">Negotiation mode multiplier</span>
        <input
          className="input"
          type="number"
          step="0.0001"
          value={negotiation}
          onChange={(e) => setNegotiation(e.target.value)}
        />
      </label>
      <p className="text-xs text-black/50 dark:text-white/50">
        Multipliers are seeded at 1.0000 (neutral placeholder) until the business supplies real
        Premium vs Negotiation margin figures.
      </p>
      <button className="btn-primary" type="submit" disabled={isPending}>
        Save Settings
      </button>
      {message && <p className="text-sm text-green-700 dark:text-green-400">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
