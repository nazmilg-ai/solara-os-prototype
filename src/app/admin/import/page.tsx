import { ImportSection } from "./ImportSection";
import {
  importFabrics,
  importBandMappings,
  importPriceListRows,
  importDiscountRates,
  importMaxSizeRules,
} from "./actions";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import Pricing Data</h1>
        <p className="text-black/60 dark:text-white/60 mt-1 max-w-2xl">
          Upload the real CSV exports here once ready. Import in this order: Fabrics &amp; Colours
          first, then Band Mappings, Price Lists, Discount Rates and Max Size Rules. Supplier codes
          are <code>DECORA</code> and <code>BEVERLEY</code>. Re-uploading the same file is safe —
          exact duplicate rows are skipped.
        </p>
      </div>

      <ImportSection
        title="Fabrics & Colours"
        description="Category + Fabric/Item name (keep size suffixes like 'Bella (89/127mm)' as-is), with an optional colour. Categories are created automatically if new."
        columns={["category", "fabric", "colour"]}
        sampleRow={["FB Roller", "Bella (89/127mm)", "Slate Grey"]}
        action={importFabrics}
      />

      <ImportSection
        title="Fabric → Band Mappings"
        description="Per supplier. If a fabric genuinely maps to two different bands in the source data, upload both rows — the quote builder will surface that as 'multiple matches' rather than guessing."
        columns={["supplierCode", "category", "fabric", "band"]}
        sampleRow={["DECORA", "FB Roller", "Bella (89/127mm)", "B12"]}
        action={importBandMappings}
      />

      <ImportSection
        title="Price List Rows"
        description="Category + Band + Width/Drop range → supplier list price ex VAT. Ranges may legitimately overlap in the source sheet; overlaps with differing prices surface as 'multiple matches'."
        columns={["supplierCode", "category", "band", "widthFrom", "widthTo", "dropFrom", "dropTo", "listPriceExVat"]}
        sampleRow={["DECORA", "FB Roller", "B12", "0", "1000", "0", "1000", "42.50"]}
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
        description="Per category + system/mechanism (e.g. Manual, Motorised). Categories with no rule uploaded will correctly show 'No size data — verify manually'."
        columns={["category", "system", "minWidth", "maxWidth", "minDrop", "maxDrop"]}
        sampleRow={["FB Roller", "Motorised", "", "2400", "", "2500"]}
        action={importMaxSizeRules}
      />
    </div>
  );
}
