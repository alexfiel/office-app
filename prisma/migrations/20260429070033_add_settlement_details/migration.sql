-- AlterTable
ALTER TABLE "FoodVoucherIssuerAcknowledgement" ADD COLUMN     "settlementId" TEXT;

-- CreateTable
CREATE TABLE "FoodVoucherSettlement" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "arNumber" TEXT NOT NULL,
    "datePaid" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "FoodVoucherSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodVoucherSettlementDetails" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "arNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "market" TEXT NOT NULL,
    "stallNo" TEXT NOT NULL,
    "datePaid" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "FoodVoucherSettlementDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FoodVoucherSettlement_arNumber_key" ON "FoodVoucherSettlement"("arNumber");

-- AddForeignKey
ALTER TABLE "FoodVoucherIssuerAcknowledgement" ADD CONSTRAINT "FoodVoucherIssuerAcknowledgement_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "FoodVoucherSettlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodVoucherSettlement" ADD CONSTRAINT "FoodVoucherSettlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodVoucherSettlementDetails" ADD CONSTRAINT "FoodVoucherSettlementDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodVoucherSettlementDetails" ADD CONSTRAINT "FoodVoucherSettlementDetails_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "FoodVoucherSettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
