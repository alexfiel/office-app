-- AlterTable
ALTER TABLE "Collections" ADD COLUMN     "daily_collection_id" TEXT;

-- CreateTable
CREATE TABLE "daily_collections" (
    "id" TEXT NOT NULL,
    "control_no" TEXT NOT NULL,
    "collectionitemids" TEXT[],
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "totalDeposits" DECIMAL(15,2) NOT NULL,
    "userId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_collections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_collections_control_no_key" ON "daily_collections"("control_no");

-- AddForeignKey
ALTER TABLE "Collections" ADD CONSTRAINT "Collections_daily_collection_id_fkey" FOREIGN KEY ("daily_collection_id") REFERENCES "daily_collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_collections" ADD CONSTRAINT "daily_collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
