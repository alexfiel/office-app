-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'APPROVER';

-- AlterTable
ALTER TABLE "NewTransferTax" ALTER COLUMN "t_status" SET DEFAULT 'pending approval';
ALTER TABLE "NewTransferTax" ADD COLUMN IF NOT EXISTS "t_approvedDate" TIMESTAMP(3);
ALTER TABLE "NewTransferTax" ADD COLUMN IF NOT EXISTS "t_approvedBy" TEXT;
ALTER TABLE "NewTransferTax" ADD COLUMN IF NOT EXISTS "t_approvalRemarks" TEXT;
