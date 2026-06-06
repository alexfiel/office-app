-- CreateTable
CREATE TABLE "NewTransferTax" (
    "id" TEXT NOT NULL,
    "t_controlNumber" TEXT NOT NULL,
    "t_TotalAmountDue" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "t_TotalSurcharge" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "t_TotalInterest" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "t_NotarialId" TEXT NOT NULL,
    "t_DateCompute" TIMESTAMP(3) NOT NULL,
    "t_validity" TIMESTAMP(3) NOT NULL,
    "t_daysElapsed" INTEGER NOT NULL DEFAULT 0,
    "t_status" TEXT NOT NULL DEFAULT 'pending',
    "t_paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "t_paymentReference" TEXT NOT NULL,
    "t_remarks" TEXT NOT NULL,
    "t_userId" TEXT NOT NULL,

    CONSTRAINT "NewTransferTax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewTransferTaxDetails" (
    "id" TEXT NOT NULL,
    "nt_transferee" TEXT NOT NULL,
    "nt_transferror" TEXT NOT NULL,
    "nt_transactiontype" TEXT NOT NULL,
    "nt_taxdecnumber" TEXT NOT NULL,
    "nt_lotnumber" TEXT NOT NULL,
    "nt_area" DOUBLE PRECISION NOT NULL,
    "nt_marketvalue" DECIMAL(65,30) NOT NULL,
    "nt_considerationvalue" DECIMAL(65,30) NOT NULL,
    "nt_taxbase" DECIMAL(65,30) NOT NULL,
    "nt_transfertaxDue" DECIMAL(65,30) NOT NULL,
    "nt_surcharge" DECIMAL(65,30) NOT NULL,
    "nt_interest" DECIMAL(65,30) NOT NULL,
    "nt_totalTransferTaxDue" DECIMAL(65,30) NOT NULL,
    "nt_transfertaxid" TEXT NOT NULL,
    "nt_userid" TEXT NOT NULL,
    "nt_realpropertyid" TEXT NOT NULL,

    CONSTRAINT "NewTransferTaxDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capturedPayment" (
    "id" TEXT NOT NULL,
    "cp_receiptnumber" TEXT NOT NULL,
    "cp_amount" DECIMAL(65,30) NOT NULL,
    "cp_paymentDate" TIMESTAMP(3) NOT NULL,
    "cp_remarks" TEXT NOT NULL,
    "cp_modeOfPayment" TEXT NOT NULL,
    "cp_NewTransferTaxId" TEXT NOT NULL,
    "cp_UserId" TEXT NOT NULL,

    CONSTRAINT "capturedPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewTransferTax_t_controlNumber_key" ON "NewTransferTax"("t_controlNumber");

-- CreateIndex
CREATE UNIQUE INDEX "NewTransferTax_t_paymentReference_key" ON "NewTransferTax"("t_paymentReference");

-- CreateIndex
CREATE UNIQUE INDEX "capturedPayment_cp_receiptnumber_key" ON "capturedPayment"("cp_receiptnumber");

-- CreateIndex
CREATE UNIQUE INDEX "capturedPayment_cp_NewTransferTaxId_key" ON "capturedPayment"("cp_NewTransferTaxId");

-- AddForeignKey
ALTER TABLE "NewTransferTax" ADD CONSTRAINT "NewTransferTax_t_NotarialId_fkey" FOREIGN KEY ("t_NotarialId") REFERENCES "NotarialDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewTransferTax" ADD CONSTRAINT "NewTransferTax_t_userId_fkey" FOREIGN KEY ("t_userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewTransferTaxDetails" ADD CONSTRAINT "NewTransferTaxDetails_nt_transfertaxid_fkey" FOREIGN KEY ("nt_transfertaxid") REFERENCES "NewTransferTax"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewTransferTaxDetails" ADD CONSTRAINT "NewTransferTaxDetails_nt_userid_fkey" FOREIGN KEY ("nt_userid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewTransferTaxDetails" ADD CONSTRAINT "NewTransferTaxDetails_nt_realpropertyid_fkey" FOREIGN KEY ("nt_realpropertyid") REFERENCES "RealProperty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capturedPayment" ADD CONSTRAINT "capturedPayment_cp_NewTransferTaxId_fkey" FOREIGN KEY ("cp_NewTransferTaxId") REFERENCES "NewTransferTax"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capturedPayment" ADD CONSTRAINT "capturedPayment_cp_UserId_fkey" FOREIGN KEY ("cp_UserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
