-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'ISSUER', 'LIQUIDATOR', 'VALIDATOR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "designation" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealProperty" (
    "id" TEXT NOT NULL,
    "objid" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "taxdecnumber" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "rputype" TEXT NOT NULL,
    "barangay" TEXT NOT NULL,
    "classcode" TEXT NOT NULL,
    "lotNumber" TEXT,
    "blockNumber" TEXT,
    "surveyno" TEXT,
    "tctOct" TEXT,
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
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validuntil" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notarialDocumentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayselapsed" INTEGER NOT NULL DEFAULT 0,

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

-- CreateTable
CREATE TABLE "ChainTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transferTaxId" TEXT NOT NULL,
    "basicTaxDue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deceasedOwner" TEXT NOT NULL,
    "deceasedShare" DOUBLE PRECISION NOT NULL,
    "heirs" TEXT NOT NULL,
    "taxBase" DOUBLE PRECISION NOT NULL,
    "realPropertyId" TEXT,

    CONSTRAINT "ChainTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeSignature" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "signatureUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficeSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibrengSakayRoute" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "routeName" TEXT NOT NULL,
    "fare" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibrengSakayRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibrengSakayTrip" (
    "id" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "driverName" TEXT NOT NULL,
    "vehiclePlateNumber" TEXT NOT NULL,
    "numberofPax" INTEGER NOT NULL,
    "fare" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "routeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "LibrengSakayTrip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibrengSakayLiquidation" (
    "id" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "arnumber" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "vehiclePlateNumber" TEXT NOT NULL,
    "numberofPax" INTEGER NOT NULL,
    "fare" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "preparedby" TEXT NOT NULL,
    "approvedby" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "LibrengSakayLiquidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibrengSakayBudget" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "totalBudget" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibrengSakayBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodVoucher" (
    "id" TEXT NOT NULL,
    "voucherCode" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "vendorId" TEXT,

    CONSTRAINT "FoodVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodVoucherVendor" (
    "id" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "stallNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodVoucherVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodVoucherRedemptionClaim" (
    "id" TEXT NOT NULL,
    "redemptionCode" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "FoodVoucherRedemptionClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodVoucherRedemptionClaimDetails" (
    "id" TEXT NOT NULL,
    "redemptionClaimId" TEXT NOT NULL,
    "foodVoucherId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "FoodVoucherRedemptionClaimDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodVoucherIssuerAcknowledgement" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "ackDate" TIMESTAMP(3),
    "ackBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "arNumber" TEXT NOT NULL,
    "redemptionClaimId" TEXT,
    "vendorClaimId" TEXT,

    CONSTRAINT "FoodVoucherIssuerAcknowledgement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodVoucherVendorClaim" (
    "id" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "stallNo" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "claimControlNo" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "voucherCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "FoodVoucherVendorClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKeyModel" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKeyModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RealProperty_objid_key" ON "RealProperty"("objid");

-- CreateIndex
CREATE UNIQUE INDEX "FoodVoucherRedemptionClaim_redemptionCode_key" ON "FoodVoucherRedemptionClaim"("redemptionCode");

-- CreateIndex
CREATE UNIQUE INDEX "FoodVoucherIssuerAcknowledgement_arNumber_key" ON "FoodVoucherIssuerAcknowledgement"("arNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FoodVoucherIssuerAcknowledgement_redemptionClaimId_key" ON "FoodVoucherIssuerAcknowledgement"("redemptionClaimId");

-- CreateIndex
CREATE UNIQUE INDEX "FoodVoucherIssuerAcknowledgement_vendorClaimId_key" ON "FoodVoucherIssuerAcknowledgement"("vendorClaimId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKeyModel_key_key" ON "ApiKeyModel"("key");

-- AddForeignKey
ALTER TABLE "RealProperty" ADD CONSTRAINT "RealProperty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotarialDocument" ADD CONSTRAINT "NotarialDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferTax" ADD CONSTRAINT "TransferTax_notarialDocumentId_fkey" FOREIGN KEY ("notarialDocumentId") REFERENCES "NotarialDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferTax" ADD CONSTRAINT "TransferTax_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferTaxDetails" ADD CONSTRAINT "TransferTaxDetails_realPropertyId_fkey" FOREIGN KEY ("realPropertyId") REFERENCES "RealProperty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferTaxDetails" ADD CONSTRAINT "TransferTaxDetails_transferTaxId_fkey" FOREIGN KEY ("transferTaxId") REFERENCES "TransferTax"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferTaxDetails" ADD CONSTRAINT "TransferTaxDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChainTransaction" ADD CONSTRAINT "ChainTransaction_realPropertyId_fkey" FOREIGN KEY ("realPropertyId") REFERENCES "RealProperty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChainTransaction" ADD CONSTRAINT "ChainTransaction_transferTaxId_fkey" FOREIGN KEY ("transferTaxId") REFERENCES "TransferTax"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChainTransaction" ADD CONSTRAINT "ChainTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibrengSakayTrip" ADD CONSTRAINT "LibrengSakayTrip_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "LibrengSakayRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibrengSakayTrip" ADD CONSTRAINT "LibrengSakayTrip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibrengSakayLiquidation" ADD CONSTRAINT "LibrengSakayLiquidation_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "LibrengSakayTrip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibrengSakayLiquidation" ADD CONSTRAINT "LibrengSakayLiquidation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodVoucher" ADD CONSTRAINT "FoodVoucher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodVoucher" ADD CONSTRAINT "FoodVoucher_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "FoodVoucherVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodVoucherVendor" ADD CONSTRAINT "FoodVoucherVendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodVoucherRedemptionClaim" ADD CONSTRAINT "FoodVoucherRedemptionClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodVoucherRedemptionClaim" ADD CONSTRAINT "FoodVoucherRedemptionClaim_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "FoodVoucherVendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodVoucherRedemptionClaimDetails" ADD CONSTRAINT "FoodVoucherRedemptionClaimDetails_foodVoucherId_fkey" FOREIGN KEY ("foodVoucherId") REFERENCES "FoodVoucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodVoucherRedemptionClaimDetails" ADD CONSTRAINT "FoodVoucherRedemptionClaimDetails_redemptionClaimId_fkey" FOREIGN KEY ("redemptionClaimId") REFERENCES "FoodVoucherRedemptionClaim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodVoucherIssuerAcknowledgement" ADD CONSTRAINT "FoodVoucherIssuerAcknowledgement_redemptionClaimId_fkey" FOREIGN KEY ("redemptionClaimId") REFERENCES "FoodVoucherRedemptionClaim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodVoucherIssuerAcknowledgement" ADD CONSTRAINT "FoodVoucherIssuerAcknowledgement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodVoucherIssuerAcknowledgement" ADD CONSTRAINT "FoodVoucherIssuerAcknowledgement_vendorClaimId_fkey" FOREIGN KEY ("vendorClaimId") REFERENCES "FoodVoucherVendorClaim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodVoucherVendorClaim" ADD CONSTRAINT "FoodVoucherVendorClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKeyModel" ADD CONSTRAINT "ApiKeyModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
