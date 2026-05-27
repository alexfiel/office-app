-- AlterTable
ALTER TABLE "CollectionCategory" ADD COLUMN     "collectionGroupId" TEXT;

-- CreateTable
CREATE TABLE "CollectionGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CollectionGroup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CollectionCategory" ADD CONSTRAINT "CollectionCategory_collectionGroupId_fkey" FOREIGN KEY ("collectionGroupId") REFERENCES "CollectionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
