/*
  Warnings:

  - Added the required column `barangay` to the `external_report_of_disbursement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number_of_vouchers` to the `external_report_of_disbursement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_voucher_amount` to the `external_report_of_disbursement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "external_report_of_disbursement" ADD COLUMN     "barangay" TEXT NOT NULL,
ADD COLUMN     "number_of_vouchers" INTEGER NOT NULL,
ADD COLUMN     "total_voucher_amount" DECIMAL(10,2) NOT NULL;
