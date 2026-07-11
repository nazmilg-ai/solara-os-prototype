Solara Pricing Engine — Web App Prototype Brief

WHAT THIS IS
A trial-period web app prototype for a window furnishings (blinds/curtains/shutters)
business, replacing an Excel-based pricing engine. Two brands, Solara Shades and
Blinds Kingdom, use the same backend.

CORE WORKFLOW (Quote Builder)
An advisor should be able to:
1. Pick a Product Category (e.g. "FB Roller", "Fauxwood", "Starwood")
2. Pick a Fabric/Item Name, filtered to that category. Category+Fabric together map
   to a pricing Band. NOTE: some fabric names include a size suffix like
   "Bella (89/127mm)" — these are the literal correct names, don't strip them.
3. Optionally pick a Colour. Colour is informational only — it does NOT affect price,
   only Category+Fabric does. Not every category will have colour data; that's expected.
4. Enter Width (mm), Drop (mm), Quantity, and Pricing Mode (Premium or Negotiation —
   two different margin multipliers).
5. Look up: Category+Fabric → Band, then Category+Band+Width+Drop → Supplier List
   Price ex VAT (price tables have Width From/To and Drop From/To ranges per row).
6. IMPORTANT — handle "no match" and "multiple match" explicitly, don't silently guess:
   if zero rows match, show "Not found"/"No match" clearly. If more than one row matches
   (this genuinely happens — some fabric names exist under two variants, e.g. plain vs
   "with tapes"), show "Multiple matches — refine selection" rather than picking one
   arbitrarily.
7. Apply a Discount % (varies by category, with a default fallback) to get Solara Cost
   ex VAT.
8. Apply VAT (20%) and the Pricing Mode multiplier to get Unit Price inc VAT.
9. Multiply by Quantity for Line Total. Apply a Deposit % to split into Deposit
   and Balance.
10. Check entered Width/Drop against a max-size table (per Product Category and
    System/Mechanism, since motorised vs manual often have different limits). Show one
    of three states: "OK" (within range), "Outside size range — check mechanism"
    (exceeds a real limit), or "No size data — verify manually" (category not yet
    covered — most categories aren't yet, be honest about this, don't default to "OK").

MULTI-LINE QUOTES
Should support building a quote with multiple line items (like a shopping cart), each
going through the full lookup above, with a grand total, deposit, and balance across
all lines.

TWO SUPPLIERS — this is important, don't conflate them
- Decora: pricing = list price minus a negotiated discount % (varies by category).
  Trade credit account.
- Beverley Blinds: FIXED price, NO discount at all — cost is their list price directly,
  only a markup gets added on top. Credit terms: invoice due by the 20th of the month
  following the invoice date. I only have fabric-to-band mappings for Beverley so far
  (Vertical and Roller categories) — no actual £ price grids yet. Build the data model
  to support a second supplier's price table being added later, but don't fabricate
  Beverley prices now.
- Other future suppliers: proforma only (pay before dispatch), not yet integrated at all.

CUSTOMER RECORDS
Need a customer database: Account No, First Name, Last Name, address fields, phone,
email, Date Registered, Notes. Just build the CRUD screens — no seed data needed,
starts empty.

EXPLICITLY OUT OF SCOPE FOR THIS PROTOTYPE
- Real Beverley pricing (data not ready)
- Payment processing
- Max-size checks for Roller/Vertical/Timberlux/Perfect Fit Aluminium-Roller-Softshade
  — genuinely missing data, app should just show "No size data" for them, not error.

DATA
I have CSV exports of the actual pricing/fabric/colour/size data ready to provide
separately (they didn't make it into this repo yet). For now, please scaffold the
app structure and data model based on this brief, and I'll get the real CSVs to you
next.

TECH PREFERENCE
Please use a stack that deploys easily to Vercel (e.g. Next.js), so it can be
previewed as a live URL without anything running locally.
