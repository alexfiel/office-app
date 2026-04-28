/*
  Warnings:

  - You are about to drop the column `validUntil` on the `TransferTax` table. All the data in the column will be lost.
  - Added the required column `validuntil` to the `TransferTax` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TransferTax" DROP COLUMN "validUntil",
ADD COLUMN     "validuntil" TEXT NOT NULL;
