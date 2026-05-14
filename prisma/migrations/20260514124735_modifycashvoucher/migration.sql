/*
  Warnings:

  - Added the required column `balance` to the `cash_advance_vouchers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cash_advance_vouchers" ADD COLUMN     "balance" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';
