-- CreateEnum
CREATE TYPE "EventMode" AS ENUM ('ONLINE', 'OFFLINE', 'HYBRID');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "eventMode" "EventMode" NOT NULL DEFAULT 'OFFLINE',
ADD COLUMN     "meetLink" TEXT,
ADD COLUMN     "registrationUrl" TEXT;
