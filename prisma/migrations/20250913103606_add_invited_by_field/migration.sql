-- AlterTable
ALTER TABLE "public"."attendances" ADD COLUMN     "invited_by" TEXT;

-- AddForeignKey
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
