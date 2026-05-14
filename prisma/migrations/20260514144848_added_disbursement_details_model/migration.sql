/*
  Warnings:

  - You are about to drop the column `barangay` on the `external_report_of_disbursement` table. All the data in the column will be lost.
  - You are about to drop the column `number_of_vouchers` on the `external_report_of_disbursement` table. All the data in the column will be lost.
  - You are about to drop the column `particulars` on the `external_report_of_disbursement` table. All the data in the column will be lost.
  - You are about to drop the column `total_voucher_amount` on the `external_report_of_disbursement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "external_report_of_disbursement" DROP COLUMN "barangay",
DROP COLUMN "number_of_vouchers",
DROP COLUMN "particulars",
DROP COLUMN "total_voucher_amount";

-- CreateTable
CREATE TABLE "ExternalReportofDisbursementDetails" (
    "id" TEXT NOT NULL,
    "external_report_of_disbursement_id" TEXT NOT NULL,
    "barangay" TEXT NOT NULL,
    "number_of_vouchers" INTEGER NOT NULL,
    "total_voucher_amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ExternalReportofDisbursementDetails_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExternalReportofDisbursementDetails" ADD CONSTRAINT "ExternalReportofDisbursementDetails_external_report_of_dis_fkey" FOREIGN KEY ("external_report_of_disbursement_id") REFERENCES "external_report_of_disbursement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
