-- DropForeignKey
ALTER TABLE "Colour" DROP CONSTRAINT "Colour_fabricId_fkey";

-- DropIndex
DROP INDEX "Colour_fabricId_name_key";

-- DropIndex
DROP INDEX "PriceListRow_supplierId_categoryId_band_idx";

-- AlterTable
ALTER TABLE "Colour" DROP COLUMN "fabricId",
ADD COLUMN     "categoryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "country",
DROP COLUMN "phone",
ADD COLUMN     "county" TEXT,
ADD COLUMN     "doorNo" TEXT,
ADD COLUMN     "mobileNumber" TEXT,
ADD COLUMN     "telephoneNumber" TEXT;

-- AlterTable
ALTER TABLE "FabricBandMapping" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "priceTableRef" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PriceListRow" ADD COLUMN     "priceTableRef" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "QuoteLine" ADD COLUMN     "priceTableRef" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Colour_categoryId_name_key" ON "Colour"("categoryId", "name");

-- CreateIndex
CREATE INDEX "PriceListRow_supplierId_categoryId_priceTableRef_idx" ON "PriceListRow"("supplierId", "categoryId", "priceTableRef");

-- AddForeignKey
ALTER TABLE "Colour" ADD CONSTRAINT "Colour_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

