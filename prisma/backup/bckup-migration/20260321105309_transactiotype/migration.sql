-- CreateTable
CREATE TABLE "RealProperty" (
    "id" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "taxdecnumber" TEXT NOT NULL,
    "tctOct" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "marketValue" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentUrl" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RealProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotarialDocument" (
    "id" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "notarialDate" TIMESTAMP(3) NOT NULL,
    "notarizedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "document_url" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "NotarialDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferTax" (
    "id" TEXT NOT NULL,
    "transferee" TEXT NOT NULL,
    "transferor" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "considerationvalue" DECIMAL(65,30) NOT NULL,
    "totalmarketvalue" DECIMAL(65,30) NOT NULL,
    "taxbase" DECIMAL(65,30) NOT NULL,
    "taxdue" DECIMAL(65,30) NOT NULL,
    "surcharge" DECIMAL(65,30) NOT NULL,
    "interest" DECIMAL(65,30) NOT NULL,
    "totalamountdue" DECIMAL(65,30) NOT NULL,
    "paymentstatus" TEXT NOT NULL,
    "paymentdate" TIMESTAMP(3) NOT NULL,
    "paymentmethod" TEXT NOT NULL,
    "paymentreference" TEXT NOT NULL,
    "paymentamount" DECIMAL(65,30) NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notarialDocumentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TransferTax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferTaxDetails" (
    "id" TEXT NOT NULL,
    "taxdecnumber" TEXT NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "marketValue" DECIMAL(65,30) NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "transferTaxId" TEXT NOT NULL,
    "realPropertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TransferTaxDetails_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RealProperty" ADD CONSTRAINT "RealProperty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotarialDocument" ADD CONSTRAINT "NotarialDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferTax" ADD CONSTRAINT "TransferTax_notarialDocumentId_fkey" FOREIGN KEY ("notarialDocumentId") REFERENCES "NotarialDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferTax" ADD CONSTRAINT "TransferTax_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferTaxDetails" ADD CONSTRAINT "TransferTaxDetails_transferTaxId_fkey" FOREIGN KEY ("transferTaxId") REFERENCES "TransferTax"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferTaxDetails" ADD CONSTRAINT "TransferTaxDetails_realPropertyId_fkey" FOREIGN KEY ("realPropertyId") REFERENCES "RealProperty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferTaxDetails" ADD CONSTRAINT "TransferTaxDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
