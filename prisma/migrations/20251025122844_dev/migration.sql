/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transactionId,reviewerId]` on the table `reviews` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `disputes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DisputeReason" AS ENUM ('NOT_AS_DESCRIBED', 'NOT_RECEIVED', 'DAMAGED', 'FAKE', 'SELLER_UNRESPONSIVE', 'BUYER_UNRESPONSIVE', 'PAYMENT_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "DisputePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "disputes" ADD COLUMN     "evidence" JSONB,
ADD COLUMN     "priority" "DisputePriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "reason" "DisputeReason" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "refundAmount" DECIMAL(12,2),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "class" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "username" TEXT,
ADD COLUMN     "year" TEXT;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "helpful" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "disputes_priority_status_idx" ON "disputes"("priority", "status");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_transactionId_reviewerId_key" ON "reviews"("transactionId", "reviewerId");
