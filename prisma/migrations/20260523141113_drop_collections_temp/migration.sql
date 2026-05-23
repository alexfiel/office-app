/*
  Warnings:

  - You are about to drop the column `collectionsId` on the `CollectionCategory` table. All the data in the column will be lost.
  - You are about to drop the `Collections` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CollectionCategory" DROP CONSTRAINT "CollectionCategory_collectionsId_fkey";

-- DropForeignKey
ALTER TABLE "Collections" DROP CONSTRAINT "Collections_userId_fkey";

-- AlterTable
ALTER TABLE "CollectionCategory" DROP COLUMN "collectionsId";

-- DropTable
DROP TABLE "Collections";
