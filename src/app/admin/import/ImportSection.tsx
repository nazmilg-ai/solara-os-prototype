"use client";

import { useRef, useState, useTransition } from "react";
import Papa from "papaparse";
import type { ImportSummary } from "./actions";

export function ImportSection({
  title,
  description,
  columns,
  sampleRow,
  action,
}: {
  title: string;
  description: string;
  columns: string[];
  sampleRow: string[];
  action: (rows: Record<string, string>[]) => Promise<ImportSummary>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function downloadTemplate() {
    const csv = [columns.join(","), sampleRow.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(file: File) {
    setFileName(file.name);
    setSummary(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        startTransition(async () => {
          const result = await action(results.data);
          setSummary(result);
        });
      },
    });
  }

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/15 p-5 space-y-3">
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-black/60 dark:text-white/60">{description}</p>
        <p className="text-xs text-black/50 dark:text-white/50 mt-1">
          Columns: <code>{columns.join(", ")}</code>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className="text-sm underline underline-offset-2" onClick={downloadTemplate}>
          Download CSV template
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {isPending && <p className="text-sm text-black/50 dark:text-white/50">Importing {fileName}…</p>}
      {summary && (
        <div className="text-sm space-y-1">
          <p>
            <span className="font-medium">{summary.created}</span> created,{" "}
            <span className="font-medium">{summary.skipped}</span> skipped.
          </p>
          {summary.errors.length > 0 && (
            <ul className="list-disc list-inside text-red-600 max-h-40 overflow-y-auto">
              {summary.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
