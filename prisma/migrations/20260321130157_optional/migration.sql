-- AlterTable
ALTER TABLE "TransferTax" ALTER COLUMN "paymentmethod" DROP NOT NULL,
ALTER COLUMN "paymentreference" DROP NOT NULL,
ALTER COLUMN "paymentamount" DROP NOT NULL;
