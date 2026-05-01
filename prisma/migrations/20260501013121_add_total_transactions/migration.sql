/*
  Warnings:

  - Added the required column `total_transactions` to the `external_fv_settlements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "external_fv_settlements" ADD COLUMN     "total_transactions" INTEGER NOT NULL;
