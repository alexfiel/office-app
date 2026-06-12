-- AlterTable
ALTER TABLE "NewTransferTax" ADD COLUMN     "t_TaxBase" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
ADD COLUMN     "t_TotalConsiderationValue" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
ADD COLUMN     "t_TotalMarketValue" DECIMAL(65,30) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "NewTransferTaxDetails" ALTER COLUMN "nt_considerationvalue" SET DEFAULT 0.00,
ALTER COLUMN "nt_taxbase" SET DEFAULT 0.00,
ALTER COLUMN "nt_transfertaxDue" SET DEFAULT 0.00,
ALTER COLUMN "nt_surcharge" SET DEFAULT 0.00,
ALTER COLUMN "nt_interest" SET DEFAULT 0.00,
ALTER COLUMN "nt_totalTransferTaxDue" SET DEFAULT 0.00;
