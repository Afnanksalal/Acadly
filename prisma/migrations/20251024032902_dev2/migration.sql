/*
  Warnings:

  - The `status` column on the `disputes` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED');

-- AlterTable
ALTER TABLE "disputes" ADD COLUMN     "resolution" TEXT,
ADD COLUMN     "resolvedBy" UUID,
DROP COLUMN "status",
ADD COLUMN     "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN';

-- CreateIndex
CREATE INDEX "disputes_status_createdAt_idx" ON "disputes"("status", "createdAt");
