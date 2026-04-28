/*
  Warnings:

  - You are about to drop the column `voucherCodes` on the `FoodVoucherVendorClaim` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FoodVoucherVendorClaim" DROP COLUMN "voucherCodes",
ADD COLUMN     "verifiedVoucherCodes" TEXT[] DEFAULT ARRAY[]::TEXT[];
