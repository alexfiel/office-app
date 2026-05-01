-- CreateTable
CREATE TABLE "external_fv_settlements" (
    "id" TEXT NOT NULL,
    "ar_no" TEXT NOT NULL,
    "batch_no" TEXT NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "date_paid" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "market" TEXT,
    "stall_no" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "external_fv_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_fv_transactions" (
    "id" TEXT NOT NULL,
    "voucher_code" TEXT NOT NULL,
    "beneficiary" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "settlement_id" TEXT NOT NULL,

    CONSTRAINT "external_fv_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "external_fv_settlements_ar_no_key" ON "external_fv_settlements"("ar_no");

-- AddForeignKey
ALTER TABLE "external_fv_settlements" ADD CONSTRAINT "external_fv_settlements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_fv_transactions" ADD CONSTRAINT "external_fv_transactions_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "external_fv_settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
