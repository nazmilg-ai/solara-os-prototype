MCD-01A

Sales MVP Product Engine Architecture

**Document ID: MCD-01A**

Document Title: Sales MVP Product Engine Architecture

**Status: Draft**

**Version: 1.0**

This document supersedes all prior architectural discussion of the
Product Engine, the product taxonomy, and the shared platform services
model.

**Dependencies**

-   MCD-00 --- Executive Charter

-   MCD-00A --- Project Development Standards

**Referenced By**

-   MCD-01B-xx Product Specifications

-   Supplier Library

-   Pricing Engine

-   Solara Academy

-   Manufacturing OS

Table of Contents

1\. Purpose

2\. Design Philosophy

3\. Architectural Layering

4\. Product Taxonomy

5\. Shared Platform Services

> 5.1 Survey Engine
>
> 5.2 Measurement Engine
>
> 5.3 Validation Engine
>
> 5.4 Operation Engine
>
> 5.5 Motor Engine
>
> 5.6 Child Safety Engine
>
> 5.7 Pricing Engine
>
> 5.8 Accessory Engine
>
> 5.9 Supplier Capability Engine
>
> 5.10 Recommendation Engine
>
> 5.11 Document Generation Engine
>
> 5.12 Audit & Compliance Engine

6\. Shared Service Profile

7\. Shared Service Status Definitions

8\. Product Specification Rules

9\. Supplier Library Rules

10\. Document Governance --- Splitting Shared Services

11\. Worked Example --- Roller Blinds Shared Service Profile

12\. Future Expansion

13\. Version History

1\. Purpose

Defines the architecture governing every product supported by the Sales
MVP Product Engine.

This document specifies the shared platform services, architectural
principles, and inheritance model used by all product specifications.

It deliberately avoids supplier-specific and product-specific
implementation details. Those belong within their respective Product
Specifications (MCD-01B-xx) and Supplier Library documents.

This document does not restate governance, versioning, approval, or
documentation-quality rules already defined in MCD-00A. Where such a
rule applies, this document references MCD-00A rather than duplicating
it.

2\. Design Philosophy

The Product Engine shall:

-   Be advisor-first rather than software-first.

-   Guide rather than restrict.

-   Minimise unnecessary data entry.

-   Prevent invalid configurations.

-   Support future expansion without redesign.

-   Separate platform logic from product logic.

-   Separate product logic from supplier capabilities.

-   Be configuration-driven wherever practical.

-   Remain understandable to both humans and AI.

3\. Architectural Layering

**Every feature in Solara OS must belong to exactly one architectural
layer.**

**Rule: A concept shall exist in one architectural layer only and must
not be duplicated across other layers.**

  ------------------ ----------------------------------------------------
  **Layer**          **Examples**

  Platform           Survey Engine, Pricing Engine, Child Safety Engine,
                     Recommendation Engine

  Product            Roller Blind, Roman Blind, Vertical Blind, Total
                     Blackout Blinds

  Construction /     Cassette Roller, Perfect Fit, Cruze Roman, Fit to
  System             Frame

  Supplier           Decora supports Fit to Frame; Louvolite supports
  Capability         SmartView; Arena supports specific systems

  Material / Fabric  Blackout, Dimout, FR, Screen, Sheer

  Configuration      Control side, bracket type, cassette colour, motor
                     selection

  Accessories        Remotes, brackets, extension brackets, tie-backs,
                     hubs
  ------------------ ----------------------------------------------------

This single rule captures a number of decisions reached during the
architecture's development:

-   Blackout belongs to Material/Fabric, not Product.

-   Motorisation belongs to Configuration/Operation, not Product.

-   Perfect Fit belongs to Construction/System, not Material.

-   Decora Stelor belongs to Supplier Capability, not Product.

-   Good/Better/Best belongs to the Recommendation Engine (Platform),
    not the Product.

-   Total Blackout Blinds is a genuine exception worth stating
    explicitly (see note below).

> *Total Blackout Blinds vs. blackout fabric: a standard blind or
> curtain sold in a blackout fabric or lining is Material/Fabric layer
> --- the fabric is the only thing that changes, and the product will
> always have light bleed and a halo effect at the edges regardless of
> fabric, because an open-frame blind cannot fully seal a room. Total
> Blackout Blinds is different: pleated fabric only, a four-sided
> aluminium frame (a fully enclosed system), with gaps sealed by caulk
> or trim at installation --- only this sealed construction can make a
> genuine blackout guarantee. Because it requires a structurally
> different Construction/System rather than only a different Material,
> it correctly exists as its own Product, not as a Material-layer
> variant of an existing one. "Blackout fabric" and "Total Blackout
> Blinds" must never be conflated in the UI, data model, or
> customer-facing language.*

4\. Product Taxonomy

Defines the categorisation hierarchy used throughout the Product Engine.
This is a data/categorisation hierarchy, not a workflow sequence --- see
§5 for the Shared Platform Services that govern behaviour during
configuration.

**Product Family → Construction / System → Supplier System → Collection
→ Material / Fabric → Colourway → Configuration → Accessories**

Product Specifications shall not modify this hierarchy.

> *Operation (Manual/Motorised and its variants) deliberately does not
> appear as a taxonomy node. Per §3, Operation is a Configuration-layer
> behaviour governed by the shared Operation Engine (§5.4) --- it is not
> a categorisation concept and must not be represented as one (e.g. no
> "Electric Roller Blind" category may ever exist in the product tree).*

**Product Families**

-   Standard Blinds --- Roller, Vertical, Wooden Venetian, Faux Wood
    Venetian, Metal Venetian, Roman, Pleated, Day & Night

-   Perfect Fit Systems --- Perfect Fit Roller, Pleated, Wooden
    Venetian, Faux Wood Venetian, Day & Night, Accessories

-   Bi-Fold Door Systems --- Fit to Frame Blinds (Decora), INTU Blinds,
    System Accessories

-   Skylight Systems --- Skylight Blinds, Skylight Accessories

-   Specialist Blinds --- Total Blackout Blinds, Rectangular Roof
    Blinds, Lantern Blinds, Shaped Roof Blinds, Gable Blinds, Specialist
    Accessories

-   Commercial Blinds --- same product range as Standard Blinds (see
    note below)

-   Shutters --- Styles (Full Height, Tier-on-Tier, Café Style, Tracked,
    Bay Window, Shaped, Solid Panel) × Materials (Solid Wood, Faux Wood,
    PVC, Composite, Aluminium) × Options (Blackout Shutters)

-   Curtains --- Curtains, Voiles, Curtain Tracks, Metal Poles, Wooden
    Poles, Cushion Covers, Tie Backs, Pole/Track/Curtain Accessories

-   Future Products --- Awnings, Pergolas, and future product categories

> *Commercial Blinds uses the same Product Engines as the equivalent
> Standard Blinds product --- same survey, configuration, and pricing
> logic --- with commercial-specific rules and mark-ups applied on top.
> This is a Configured relationship to the relevant shared services (see
> §7), not a duplicate engine per product.*

5\. Shared Platform Services

Every product specification shall declare its relationship with each
shared service defined below, using the Shared Service Profile (§6) and
the status definitions (§7).

**No shared service shall be redefined within a Product Specification.**

5.1 Survey Engine

**Purpose**

Provides the common survey workflow.

**Responsibilities**

-   Customer details

-   Property information

-   Room selection

-   Window identification

-   Survey progression

-   Question sequencing

-   Create multiple products within a single quotation

-   Duplicate previously entered configurations

-   Allow selective duplication of measurements and settings

-   Detect differences between duplicated items

-   Highlight deviations from the duplicated configuration

-   Require advisor confirmation where deviations exist

-   Maintain a complete audit trail of duplicated and modified items

**Extension Points**

Product-specific questions.

5.2 Measurement Engine

**Purpose**

Provides consistent measurement handling.

**Responsibilities**

-   Width

-   Height

-   Recess

-   Exact fit

-   Bay windows

-   Tolerances

-   Validation

**Extension Points**

Product-specific measurements.

5.3 Validation Engine

**Purpose**

Prevents invalid configurations.

**Responsibilities**

-   Dimension validation

-   Compatibility

-   Mandatory fields

-   Supplier rules

**Extension Points**

Product-specific validation.

5.4 Operation Engine

**Purpose**

Controls how products are operated. Shared behaviour is defined here;
Product Specifications shall only define supported operation methods.

**Responsibilities**

-   Manual Only

-   Manual or Motorised (Advisor Selection)

-   Manual or Motorised (Factory Selection)

-   Motorised Only

> *Products shall not redefine these modes.*

5.5 Motor Engine

**Purpose**

Determines compatible motor solutions.

**Responsibilities**

-   Motor compatibility

-   Weight calculations

-   Tube compatibility

-   Power options

-   Smart Home compatibility

**Extension Points**

Product Specifications define only supported options.

5.6 Child Safety Engine

**Purpose**

Implements BS EN 13120 compliance.

**Responsibilities**

-   Chain safety

-   Cord safety

-   Breakaway devices

-   Installation height

-   Compliance records

-   Customer refusal workflow

**Extension Points**

Product Specifications define only product-specific implementation (e.g.
safety device mappings per construction).

5.7 Pricing Engine

**Purpose**

Calculates pricing consistently across all products and suppliers.

**Responsibilities**

-   Dimensions

-   Supplier costs

-   Margins

-   Discounts

-   VAT

-   Commercial pricing

-   Accessories

**Extension Points**

Products define only additional pricing inputs (e.g. tube diameter,
cassette type).

> *Customer-Facing Documentation Rule: no document generated for a
> customer (quotation or invoice) may show a price breakdown or
> measurements --- customer-facing documents show the total price only,
> across every product engine's output, not only combined multi-product
> quotes. This rule exists because customers routinely shop a recorded
> quote to competitors, and an itemised breakdown makes line-by-line
> price-matching trivial. This requires a clear split between an
> internal working view (full detail --- itemised pricing,
> fabric/band/size data, measurements) and a customer-facing document
> (total price only). See §5.11 Document Generation Engine for
> implementation. Not yet decided: whether this is a single toggle-able
> view of one document or two genuinely separate document types
> generated from the same underlying data.*

5.8 Accessory Engine

**Purpose**

Manages accessory compatibility.

**Responsibilities**

-   Accessory categories

-   Compatibility

-   Mandatory accessories

-   Optional accessories

**Extension Points**

Products define only applicable accessory groups (real accessories, not
generic placeholders --- e.g. Roller: universal brackets, extension
brackets, fascias, cassettes, bottom bars, chain tensioners, child
safety devices, remotes, wall switches, smart hubs, solar panels,
battery packs).

5.9 Supplier Capability Engine

**Purpose**

Maps products to supplier capabilities.

**Responsibilities**

-   Available constructions

-   Available fabrics

-   Available motors

-   Lead times

-   Manufacturing limits

**Extension Points**

Supplier Library provides the implementation; this engine defines the
contract.

5.10 Recommendation Engine

**Purpose**

Provide intelligent, advisor-led recommendations without restricting
professional judgement. AI is one implementation of this engine, not the
engine itself --- \"Good/Better/Best\" is a UI presentation pattern this
engine may produce, not a separate capability.

**Responsibilities**

-   Generate suitable product recommendations

-   Rank compatible alternatives

-   Present recommendation tiers (e.g. Good / Better / Best) where
    appropriate

-   Explain the reasoning behind recommendations

-   Highlight trade-offs between cost, performance, and features

-   Suggest upgrades only when they provide genuine customer benefit

-   Support AI-assisted recommendations where enabled

**Extension Points**

Product Specifications define only: product-specific recommendation
rules, product-specific upgrade paths, and product-specific exclusions.

> *Governing principle: the advisor retains complete control. The system
> recommends and explains --- it does not dictate. Not yet decided:
> whether the specific three options in a Good/Better/Best presentation
> are generated by a defined per-category rule (e.g. cheapest in-stock /
> mid popular range / premium) or assembled from advisor judgement that
> the system packages for presentation.*

5.11 Document Generation Engine

**Purpose**

Produces customer and operational documents.

**Responsibilities**

-   Quotations

-   Technical Design Proof

-   Manufacturing orders

-   Installation sheets

-   Customer acceptance

-   Invoice data

**Extension Points**

Products define additional fields where required.

> *This engine is responsible for enforcing the Customer-Facing
> Documentation Rule defined under §5.7: no quotation or invoice
> generated for a customer may contain a price breakdown or
> measurements, regardless of product or how many products are combined
> in one quotation.*

5.12 Audit & Compliance Engine

**Purpose**

Maintains auditability.

**Responsibilities**

-   User history

-   Decision history

-   Product changes

-   Compliance logs

-   Approval records

6\. Shared Service Profile

**Every Product Specification shall include a complete Shared Service
Profile covering every Shared Platform Service defined in §5.**

**No service may be omitted. Where a service is not relevant, it shall
be explicitly marked Not Applicable.**

This ensures that every product's relationship with the platform is
fully documented and avoids ambiguity arising from omitted services. See
§11 for a complete worked example.

7\. Shared Service Status Definitions

Every Product Specification shall classify each Shared Platform Service
using exactly one of the following six values:

  ---------------- ------------------------------------------------------
  **Status**       **Meaning**

  Full             Uses the shared service exactly as defined, with no
                   configuration or additional rules.

  Configured       Uses the shared service by selecting or parameterising
                   existing platform capabilities. No new behaviour is
                   introduced.

  Extended         Adds genuinely new behaviour to the shared service
                   that the platform does not already provide.

  Restricted       Deliberately disables or prevents one or more shared
                   capabilities.

  Not Applicable   The service is not relevant to this product.

  Future           Capability reserved for future implementation.
  ---------------- ------------------------------------------------------

**Objective test for "Extended" (MCD-00A rule)**

A Product Specification may only be marked Extended for a given service
if implementing that product would require a change to the shared
platform service itself.

If no platform change is required, the product's relationship to that
service is one of: Full (uses the default behaviour), Configured
(selects from existing capabilities), or Restricted (deliberately
excludes capabilities). This test is objective and removes subjectivity
from classification, keeping Shared Service Profiles consistent across
every product specification as the library grows.

> *Worked distinction: a Roller Blind using "Manual" and "Manual or
> Motorised (Advisor Selection)" is Configured --- it selects two of the
> four modes the Operation Engine already defines; it invents nothing. A
> future product introducing a genuinely new mode (e.g. synchronised
> motor control across linked blinds, which does not exist anywhere in
> the platform today) would be Extended, because the shared Operation
> Engine itself would need to change to support it. A product that only
> allows Manual operation despite the shared engine supporting
> motorisation is Restricted, because it deliberately excludes existing
> functionality.*

8\. Product Specification Rules

Product Specifications (MCD-01B-xx) shall:

-   Reference shared services; never duplicate shared logic.

-   Document only product-specific behaviour.

-   Declare supported operation modes (selected from §5.4, never
    redefined).

-   Declare supported accessory groups, named specifically --- not
    generic placeholders.

-   Declare supplier-independent rules.

-   Reference Supplier Library documents where appropriate.

-   Include a complete Shared Service Profile per §6 and §7.

-   Distinguish Product Variants (genuine construction differences only)
    from Material/Fabric attributes (e.g. Blackout, Dimout, FR are
    labels, not variants) per §3.

9\. Supplier Library Rules

Supplier documents shall define:

-   Available constructions

-   Collections

-   Materials

-   Hardware

-   Motors

-   Accessories

-   Manufacturing limits

-   Lead times

**Supplier documents shall not redefine Product Engine behaviour.**

10\. Document Governance --- Splitting Shared Services

**Governance rule: a document is only split when its size, complexity,
or maintenance burden justifies the separation. Separate only when the
separation creates value.**

Stage 1 (current state): all twelve Shared Platform Services are defined
as subsections within this single document, MCD-01A. One document, one
version number, one approval, no cross-document synchronisation risk.

Stage 2 (future, conditional): if a given service grows large enough
that its maintenance burden justifies separation --- for example, if the
Pricing Engine subsection grows substantially because of margins, VAT,
commercial pricing, discounts, supplier costs, and promotions --- that
service may be extracted into its own document (e.g. MCD-01A-07), with
this document retaining only a reference and version pointer (e.g.
\"Pricing Engine → see MCD-01A-07 v2.3\"). At that point, and only at
that point, MCD-01A begins to also serve as an architectural index for
that service.

This is not to be done pre-emptively. Splitting before a service has
real size or complexity solves a problem that does not yet exist while
introducing one that would: synchronisation drift across multiple
architecture documents.

11\. Worked Example --- Roller Blinds Shared Service Profile

This is a complete, correctly-classified Shared Service Profile,
provided as the template for every Product Specification's own profile.
Every service appears, including those that would be Not Applicable for
a different product.

  ------------------------- ------------ ---------------------------------
  **Shared Platform         **Status**   **Notes**
  Service**                              

  Survey Engine             Full         Standard workflow with
                                         Roller-specific questions

  Measurement Engine        Extended     Adds Roller-specific measurement
                                         rules

  Validation Engine         Extended     Tube and bracket validation

  Operation Engine          Configured   Supports Manual and Manual or
                                         Motorised (Advisor Selection)
                                         using existing shared modes

  Motor Engine              Configured   Enables battery, mains, and solar
                                         options where supported by the
                                         selected supplier

  Child Safety Engine       Configured   Applies shared child safety logic
                                         with Roller-specific safety
                                         device mappings

  Pricing Engine            Extended     Fabric bands, cassette, and motor
                                         pricing

  Accessory Engine          Extended     Roller accessory groups

  Supplier Capability       Full         Uses supplier capability matrix
  Engine                                 

  Recommendation Engine     Configured   Uses shared recommendation
                                         framework with Roller-specific
                                         configuration data

  Document Generation       Full         Standard outputs
  Engine                                 

  Audit & Compliance Engine Full         Standard implementation
  ------------------------- ------------ ---------------------------------

> *Compare against §7's objective test before finalising any product's
> profile: a status of Extended must only be used where implementing
> that product genuinely requires a change to the shared service itself;
> selecting among the shared service's existing capabilities is
> Configured, not Extended.*

12\. Future Expansion

The architecture shall support future products without structural
redesign. Examples include:

-   Awnings

-   Pergolas

-   External Shading

-   Fly Screens

-   Outdoor Blinds

-   New motor technologies

-   New supplier integrations

13\. Version History

  ------------- ----------------------------------------------------------
  **Version**   **Summary**

  0.1           Initial per-product draft specifications (Roller,
                Vertical, Roman) with generic single-sentence sections.

  0.2           Corrected Product Variants to exclude Material/Fabric
                attributes (e.g. Blackout) from construction-level variant
                lists.

  1.0 Draft     Full architectural consolidation: Architectural Layering
                principle, complete Product Taxonomy, twelve Shared
                Platform Services, six-status Shared Service Profile model
                with objective Extended test, document-splitting
                governance rule, and corrected Roller worked example.
                Supersedes all prior discussion.
  ------------- ----------------------------------------------------------
