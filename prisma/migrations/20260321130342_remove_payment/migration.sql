/*
  Warnings:

  - You are about to drop the column `paymentamount` on the `TransferTax` table. All the data in the column will be lost.
  - You are about to drop the column `paymentdate` on the `TransferTax` table. All the data in the column will be lost.
  - You are about to drop the column `paymentmethod` on the `TransferTax` table. All the data in the column will be lost.
  - You are about to drop the column `paymentreference` on the `TransferTax` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TransferTax" DROP COLUMN "paymentamount",
DROP COLUMN "paymentdate",
DROP COLUMN "paymentmethod",
DROP COLUMN "paymentreference";
