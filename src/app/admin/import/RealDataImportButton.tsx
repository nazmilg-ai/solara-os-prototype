"use client";

import { useState, useTransition } from "react";
import { runRealDataImport } from "./real-data-actions";
import type { RealDataImportReport } from "@/lib/import-real-data";

export function RealDataImportButton() {
  const [isPending, startTransition] = useTransition();
  const [report, setReport] = useState<RealDataImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (
      !confirm(
        "This wipes and reloads all categories, fabrics, colours, band mappings, price rows, discounts, and max-size rules from the CSVs in the repo. Customers and saved quotes are not affected. Continue?"
      )
    ) {
      return;
    }
    setError(null);
    setReport(null);
    startTransition(async () => {
      const result = await runRealDataImport();
      if (result.ok) setReport(result.report);
      else setError(result.error);
    });
  }

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/15 p-5 space-y-3">
      <div>
        <h3 className="font-medium">Full Data Refresh (from repo CSVs)</h3>
        <p className="text-sm text-black/60 dark:text-white/60">
          Reads the 8 CSV files committed at the repo root directly — no upload needed — and
          replaces all pricing/catalogue data in one go. Use this instead of the individual
          uploads below when the CSVs in the repo have been updated. Safe to re-run.
        </p>
      </div>
      <button className="btn-primary" onClick={handleClick} disabled={isPending}>
        {isPending ? "Importing… this can take a minute for ~34,000 price rows" : "Run Full Import"}
      </button>

      {error && (
        <div className="rounded border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-800 dark:text-red-300">
          {error}
          {error.toLowerCase().includes("timeout") || error.toLowerCase().includes("timed out") ? (
            <p className="mt-1">
              This may be a serverless function timeout. Try running{" "}
              <code>npm run import:real</code> from a machine with direct database access instead.
            </p>
          ) : null}
        </div>
      )}

      {report && (
        <div className="rounded border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-3 text-sm space-y-1">
          <p className="font-medium">Import complete.</p>
          <ul className="list-disc list-inside">
            <li>{report.categories} categories, {report.fabrics} fabrics</li>
            <li>
              {report.bandMappingsCreated} Decora band mappings created ({report.bandMappingsSkipped} rows
              skipped)
            </li>
            <li>
              {report.priceRowsCreated} price rows created ({report.priceRowsSkipped} rows skipped)
            </li>
            <li>{report.coloursCreated} distinct colours</li>
            <li>
              {report.beverleyBandsCreated} Beverley band mappings created ({report.beverleyBandsSkipped}{" "}
              rows skipped)
            </li>
            <li>
              {report.maxSizeRulesCreated} max-size rules created ({report.maxSizeRulesSkipped} rows skipped)
            </li>
            <li>
              {report.discountOverridesCreated} category discount overrides ({report.discountOverridesSkipped}{" "}
              unmapped rows skipped)
            </li>
            <li>
              VAT {report.vatPercent ?? "?"}%, deposit default {report.defaultDepositPercent ?? "?"}%, Premium×
              {report.premiumMultiplier ?? "?"}, Negotiation×{report.negotiationMultiplier ?? "?"}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
