-- AlterTable
ALTER TABLE "external_fv_liquidations" ADD COLUMN     "report_of_disbursement_id" TEXT;

-- AddForeignKey
ALTER TABLE "external_fv_liquidations" ADD CONSTRAINT "external_fv_liquidations_report_of_disbursement_id_fkey" FOREIGN KEY ("report_of_disbursement_id") REFERENCES "external_report_of_disbursement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
