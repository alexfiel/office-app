-- AlterTable
ALTER TABLE "external_fv_liquidations" ADD COLUMN     "cash_advance_voucher_id" TEXT;

-- CreateTable
CREATE TABLE "cash_advance_vouchers" (
    "id" TEXT NOT NULL,
    "reference_number" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payee" TEXT NOT NULL,
    "particulars" TEXT,
    "userId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_advance_vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_report_of_disbursement" (
    "id" TEXT NOT NULL,
    "report_number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "userId" TEXT NOT NULL,
    "cash_advance_voucher_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_report_of_disbursement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cash_advance_vouchers_reference_number_key" ON "cash_advance_vouchers"("reference_number");

-- CreateIndex
CREATE UNIQUE INDEX "external_report_of_disbursement_report_number_key" ON "external_report_of_disbursement"("report_number");

-- AddForeignKey
ALTER TABLE "external_fv_liquidations" ADD CONSTRAINT "external_fv_liquidations_cash_advance_voucher_id_fkey" FOREIGN KEY ("cash_advance_voucher_id") REFERENCES "cash_advance_vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_advance_vouchers" ADD CONSTRAINT "cash_advance_vouchers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_report_of_disbursement" ADD CONSTRAINT "external_report_of_disbursement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_report_of_disbursement" ADD CONSTRAINT "external_report_of_disbursement_cash_advance_voucher_id_fkey" FOREIGN KEY ("cash_advance_voucher_id") REFERENCES "cash_advance_vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
