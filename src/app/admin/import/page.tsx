import { ImportSection } from "./ImportSection";
import { RealDataImportButton } from "./RealDataImportButton";
import {
  importFabrics,
  importColours,
  importBandMappings,
  importPriceListRows,
  importDiscountRates,
  importMaxSizeRules,
} from "./actions";

// The Full Data Refresh button can take a while for ~34k price rows — request
// the maximum serverless function duration Vercel allows for this route.
// (Hobby-tier hard caps may still apply regardless of this setting; if the
// button times out, fall back to `npm run import:real` run directly against
// the database instead.)
export const maxDuration = 300;

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import Pricing Data</h1>
        <p className="text-black/60 dark:text-white/60 mt-1 max-w-2xl">
          Upload CSV exports here. Import in this order: Fabrics, then Colours, Band Mappings,
          Price Lists, Discount Rates and Max Size Rules. Supplier codes are{" "}
          <code>DECORA</code> and <code>BEVERLEY</code>. Re-uploading the same file is safe —
          exact duplicate rows are skipped.
        </p>
      </div>

      <RealDataImportButton />

      <ImportSection
        title="Fabrics"
        description="Category + Fabric/Item name (keep size suffixes like 'Bella (89/127mm)' as-is). Categories are created automatically if new."
        columns={["category", "fabric"]}
        sampleRow={["FB Roller", "Bella (89/127mm)"]}
        action={importFabrics}
      />

      <ImportSection
        title="Colours"
        description="Informational only — colour never affects price. Scoped to a category (not a specific fabric), matching the real colour data's structure. Not every category will have colours, and that's expected."
        columns={["category", "colour"]}
        sampleRow={["Contract Vertical", "Noir"]}
        action={importColours}
      />

      <ImportSection
        title="Fabric → Band Mappings"
        description="Per supplier. priceTableRef is the actual join key into Price List Rows (use the source price table's own reference/ID) — band is just a display label and can repeat across genuinely different price tables. If a fabric genuinely maps to two different price tables, upload both rows — the quote builder will surface that as 'multiple matches' rather than guessing."
        columns={["supplierCode", "category", "fabric", "band", "priceTableRef", "notes"]}
        sampleRow={["DECORA", "FB Roller", "Bella (89/127mm)", "PRICE RANGE C", "PT-00003", ""]}
        action={importBandMappings}
      />

      <ImportSection
        title="Price List Rows"
        description="Category + priceTableRef + Width/Drop range → supplier list price ex VAT. Ranges may legitimately overlap in the source sheet; overlaps with differing prices surface as 'multiple matches'. For flat per-item prices with no width/drop, use a wide sentinel range (e.g. 1–100000)."
        columns={["supplierCode", "category", "band", "priceTableRef", "widthFrom", "widthTo", "dropFrom", "dropTo", "listPriceExVat"]}
        sampleRow={["DECORA", "FB Roller", "PRICE RANGE C", "PT-00003", "1", "610", "1", "610", "33.21"]}
        action={importPriceListRows}
      />

      <ImportSection
        title="Discount Rates"
        description="Percent discount off list price, per supplier + category. Leave category blank for that supplier's default fallback rate. Not used for FIXED_PRICE suppliers (Beverley)."
        columns={["supplierCode", "category", "discountPercent"]}
        sampleRow={["DECORA", "FB Roller", "55"]}
        action={importDiscountRates}
      />

      <ImportSection
        title="Max Size Rules"
        description="Per category + system/mechanism. Categories with no rule uploaded will correctly show 'No size data — verify manually'."
        columns={["category", "system", "minWidth", "maxWidth", "minDrop", "maxDrop"]}
        sampleRow={["Fauxwood", "Manual (35mm/50mm)", "290", "2600", "150", "3000"]}
        action={importMaxSizeRules}
      />
    </div>
  );
}
