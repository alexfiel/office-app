-- AlterTable
ALTER TABLE "external_fv_settlements" ADD COLUMN     "liquidation_id" TEXT;

-- CreateTable
CREATE TABLE "external_fv_liquidations" (
    "id" TEXT NOT NULL,
    "liquidation_no" TEXT NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "external_fv_liquidations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "external_fv_liquidations_liquidation_no_key" ON "external_fv_liquidations"("liquidation_no");

-- AddForeignKey
ALTER TABLE "external_fv_settlements" ADD CONSTRAINT "external_fv_settlements_liquidation_id_fkey" FOREIGN KEY ("liquidation_id") REFERENCES "external_fv_liquidations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_fv_liquidations" ADD CONSTRAINT "external_fv_liquidations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
