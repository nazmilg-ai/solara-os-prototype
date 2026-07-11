-- CreateEnum
CREATE TYPE "Brand" AS ENUM ('SOLARA_SHADES', 'BLINDS_KINGDOM');

-- CreateEnum
CREATE TYPE "SupplierPricingType" AS ENUM ('NEGOTIATED_DISCOUNT', 'FIXED_PRICE', 'PROFORMA');

-- CreateEnum
CREATE TYPE "PricingMode" AS ENUM ('PREMIUM', 'NEGOTIATION');

-- CreateEnum
CREATE TYPE "SizeCheckStatus" AS ENUM ('OK', 'OUTSIDE_RANGE', 'NO_DATA');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "pricingType" "SupplierPricingType" NOT NULL,
    "creditTerms" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fabric" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fabric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Colour" (
    "id" TEXT NOT NULL,
    "fabricId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Colour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FabricBandMapping" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "fabricId" TEXT NOT NULL,
    "band" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FabricBandMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListRow" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "band" TEXT NOT NULL,
    "widthFromMm" INTEGER NOT NULL,
    "widthToMm" INTEGER NOT NULL,
    "dropFromMm" INTEGER NOT NULL,
    "dropToMm" INTEGER NOT NULL,
    "listPriceExVat" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceListRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountRate" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "categoryId" TEXT,
    "discountPercent" DECIMAL(5,2) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaxSizeRule" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "minWidthMm" INTEGER,
    "maxWidthMm" INTEGER NOT NULL,
    "minDropMm" INTEGER,
    "maxDropMm" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaxSizeRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingModeRate" (
    "id" TEXT NOT NULL,
    "mode" "PricingMode" NOT NULL,
    "multiplier" DECIMAL(6,4) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingModeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "accountNo" TEXT NOT NULL,
    "brand" "Brand" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "dateRegistered" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "brand" "Brand" NOT NULL,
    "customerId" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "depositPercent" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteLine" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "fabricId" TEXT NOT NULL,
    "colourId" TEXT,
    "band" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "widthMm" INTEGER NOT NULL,
    "dropMm" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pricingMode" "PricingMode" NOT NULL,
    "listPriceExVat" DECIMAL(10,2) NOT NULL,
    "discountPercent" DECIMAL(5,2) NOT NULL,
    "solaraCostExVat" DECIMAL(10,2) NOT NULL,
    "vatPercent" DECIMAL(5,2) NOT NULL,
    "modeMultiplier" DECIMAL(6,4) NOT NULL,
    "unitPriceIncVat" DECIMAL(10,2) NOT NULL,
    "lineTotalIncVat" DECIMAL(10,2) NOT NULL,
    "sizeCheckStatus" "SizeCheckStatus" NOT NULL,
    "sizeCheckNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_name_key" ON "ProductCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Fabric_categoryId_name_key" ON "Fabric"("categoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Colour_fabricId_name_key" ON "Colour"("fabricId", "name");

-- CreateIndex
CREATE INDEX "FabricBandMapping_supplierId_categoryId_fabricId_idx" ON "FabricBandMapping"("supplierId", "categoryId", "fabricId");

-- CreateIndex
CREATE UNIQUE INDEX "FabricBandMapping_supplierId_fabricId_key" ON "FabricBandMapping"("supplierId", "fabricId");

-- CreateIndex
CREATE INDEX "PriceListRow_supplierId_categoryId_band_idx" ON "PriceListRow"("supplierId", "categoryId", "band");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountRate_supplierId_categoryId_key" ON "DiscountRate"("supplierId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "MaxSizeRule_categoryId_system_key" ON "MaxSizeRule"("categoryId", "system");

-- CreateIndex
CREATE UNIQUE INDEX "PricingModeRate_mode_key" ON "PricingModeRate"("mode");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_accountNo_key" ON "Customer"("accountNo");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");

-- AddForeignKey
ALTER TABLE "Fabric" ADD CONSTRAINT "Fabric_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colour" ADD CONSTRAINT "Colour_fabricId_fkey" FOREIGN KEY ("fabricId") REFERENCES "Fabric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FabricBandMapping" ADD CONSTRAINT "FabricBandMapping_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FabricBandMapping" ADD CONSTRAINT "FabricBandMapping_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FabricBandMapping" ADD CONSTRAINT "FabricBandMapping_fabricId_fkey" FOREIGN KEY ("fabricId") REFERENCES "Fabric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListRow" ADD CONSTRAINT "PriceListRow_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListRow" ADD CONSTRAINT "PriceListRow_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountRate" ADD CONSTRAINT "DiscountRate_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountRate" ADD CONSTRAINT "DiscountRate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaxSizeRule" ADD CONSTRAINT "MaxSizeRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_fabricId_fkey" FOREIGN KEY ("fabricId") REFERENCES "Fabric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_colourId_fkey" FOREIGN KEY ("colourId") REFERENCES "Colour"("id") ON DELETE SET NULL ON UPDATE CASCADE;
