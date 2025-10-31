CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ListingType" AS ENUM ('PRODUCT', 'SERVICE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TransactionStatus" AS ENUM ('INITIATED', 'PAID', 'CANCELLED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PickupStatus" AS ENUM ('GENERATED', 'CONFIRMED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "OfferStatus" AS ENUM ('PROPOSED', 'COUNTERED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReadStatus" AS ENUM ('SENT', 'DELIVERED', 'read');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DisputeReason" AS ENUM ('NOT_AS_DESCRIBED', 'NOT_RECEIVED', 'DAMAGED', 'FAKE', 'SELLER_UNRESPONSIVE', 'BUYER_UNRESPONSIVE', 'PAYMENT_ISSUE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DisputePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "EventStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "HostType" AS ENUM ('CLUB', 'DEPARTMENT', 'STUDENT_GROUP', 'COLLEGE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TrophyCategory" AS ENUM ('ACADEMIC', 'SPORTS', 'CULTURAL', 'TECHNICAL', 'LEADERSHIP', 'COMMUNITY', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "BadgeType" AS ENUM ('ACHIEVEMENT', 'SKILL', 'PARTICIPATION', 'MILESTONE', 'SPECIAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ProjectCategory" AS ENUM ('ACADEMIC', 'PERSONAL', 'HACKATHON', 'INTERNSHIP', 'FREELANCE', 'OPEN_SOURCE', 'RESEARCH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'COMPLETED', 'PAUSED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaperCategory" AS ENUM ('RESEARCH', 'REVIEW', 'CONFERENCE', 'JOURNAL', 'THESIS', 'DISSERTATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ClubCategory" AS ENUM ('ACADEMIC', 'TECHNICAL', 'CULTURAL', 'SPORTS', 'SOCIAL', 'PROFESSIONAL', 'HOBBY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ClubRole" AS ENUM ('MEMBER', 'COORDINATOR', 'SECRETARY', 'TREASURER', 'VICE_PRESIDENT', 'PRESIDENT', 'ADVISOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM ('GENERAL', 'TRANSACTION', 'DISPUTE', 'REVIEW', 'CHAT', 'ADMIN', 'SYSTEM', 'MARKETING', 'SECURITY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "FeedbackType" AS ENUM ('GENERAL', 'BUG_REPORT', 'FEATURE_REQUEST', 'IMPROVEMENT', 'COMPLAINT', 'COMPLIMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "FeedbackStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'DUPLICATE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "FeedbackPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AnnouncementType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'ERROR', 'MAINTENANCE', 'FEATURE', 'PROMOTION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AnnouncementPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'FRAUD', 'FAKE_LISTING', 'SCAM', 'VIOLENCE', 'HATE_SPEECH', 'COPYRIGHT', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED', 'ESCALATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReportPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "profiles" (
    "id" UUID PRIMARY KEY,
    "email" TEXT UNIQUE NOT NULL,
    "name" TEXT,
    "username" TEXT UNIQUE,
    "avatarUrl" TEXT,
    "phone" TEXT,
    "department" TEXT,
    "year" TEXT,
    "class" TEXT,
    "bio" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "categories" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "parentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id")
);

DO $$ BEGIN
    ALTER TABLE "categories" ADD CONSTRAINT "categories_name_parentId_key" UNIQUE("name", "parentId");
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "listings" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "categoryId" UUID NOT NULL,
    "images" JSONB NOT NULL,
    "type" "ListingType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "listings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id"),
    CONSTRAINT "listings_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
);

CREATE TABLE IF NOT EXISTS "chats" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "listingId" UUID NOT NULL,
    "buyerId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chats_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id"),
    CONSTRAINT "chats_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "profiles"("id"),
    CONSTRAINT "chats_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "profiles"("id")
);

DO $$ BEGIN
    ALTER TABLE "chats" ADD CONSTRAINT "chats_listingId_buyerId_sellerId_key" UNIQUE("listingId", "buyerId", "sellerId");
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "messages" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "chatId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "readStatus" "ReadStatus" NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id"),
    CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "profiles"("id")
);

CREATE TABLE IF NOT EXISTS "offers" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "chatId" UUID NOT NULL,
    "proposerId" UUID NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'PROPOSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    CONSTRAINT "offers_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id"),
    CONSTRAINT "offers_proposerId_fkey" FOREIGN KEY ("proposerId") REFERENCES "profiles"("id")
);

CREATE TABLE IF NOT EXISTS "transactions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "buyerId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'INITIATED',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "profiles"("id"),
    CONSTRAINT "transactions_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "profiles"("id"),
    CONSTRAINT "transactions_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id")
);

CREATE TABLE IF NOT EXISTS "pickups" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "transactionId" UUID UNIQUE NOT NULL,
    "pickupCode" TEXT NOT NULL,
    "status" "PickupStatus" NOT NULL DEFAULT 'GENERATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    CONSTRAINT "pickups_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id")
);

CREATE TABLE IF NOT EXISTS "reviews" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "transactionId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "revieweeId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "helpful" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reviews_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id"),
    CONSTRAINT "reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "profiles"("id"),
    CONSTRAINT "reviews_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "profiles"("id")
);

DO $$ BEGIN
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_transactionId_reviewerId_key" UNIQUE("transactionId", "reviewerId");
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "disputes" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "transactionId" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reason" "DisputeReason" NOT NULL DEFAULT 'OTHER',
    "evidence" JSONB,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "DisputePriority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" UUID,
    "resolution" TEXT,
    "refundAmount" DECIMAL(12,2),
    CONSTRAINT "disputes_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id"),
    CONSTRAINT "disputes_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "profiles"("id")
);

CREATE TABLE IF NOT EXISTS "admin_actions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "disputeId" UUID NOT NULL,
    "adminId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_actions_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes"("id"),
    CONSTRAINT "admin_actions_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "profiles"("id")
);

CREATE TABLE IF NOT EXISTS "events" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "creatorId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "venue" TEXT NOT NULL,
    "hostType" "HostType" NOT NULL,
    "hostName" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "status" "EventStatus" NOT NULL DEFAULT 'UPCOMING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "events_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "profiles"("id")
);

CREATE TABLE IF NOT EXISTS "trophies" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "TrophyCategory" NOT NULL DEFAULT 'ACADEMIC',
    "awardedBy" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trophies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id")
);

CREATE TABLE IF NOT EXISTS "badges" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "BadgeType" NOT NULL DEFAULT 'ACHIEVEMENT',
    "iconUrl" TEXT,
    "color" TEXT DEFAULT '#3B82F6',
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id")
);

CREATE TABLE IF NOT EXISTS "projects" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ProjectCategory" NOT NULL DEFAULT 'ACADEMIC',
    "technologies" JSONB,
    "githubUrl" TEXT,
    "liveUrl" TEXT,
    "imageUrls" JSONB,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "ProjectStatus" NOT NULL DEFAULT 'COMPLETED',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id")
);

CREATE TABLE IF NOT EXISTS "papers" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT,
    "authors" JSONB NOT NULL,
    "journal" TEXT,
    "conference" TEXT,
    "publishedAt" TIMESTAMP(3),
    "doi" TEXT,
    "pdfUrl" TEXT,
    "category" "PaperCategory" NOT NULL DEFAULT 'RESEARCH',
    "keywords" JSONB,
    "citations" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "papers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id")
);

CREATE TABLE IF NOT EXISTS "clubs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT UNIQUE NOT NULL,
    "description" TEXT,
    "category" "ClubCategory" NOT NULL DEFAULT 'ACADEMIC',
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "club_memberships" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "role" "ClubRole" NOT NULL DEFAULT 'MEMBER',
    "position" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "club_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id"),
    CONSTRAINT "club_memberships_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id")
);

DO $$ BEGIN
    ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_userId_clubId_key" UNIQUE("userId", "clubId");
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "notifications" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'GENERAL',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id")
);

CREATE TABLE IF NOT EXISTS "analytics" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "eventType" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "userId" UUID,
    "sessionId" TEXT,
    "data" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id")
);

CREATE TABLE IF NOT EXISTS "feedback" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID,
    "type" "FeedbackType" NOT NULL DEFAULT 'GENERAL',
    "category" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rating" INTEGER,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "FeedbackPriority" NOT NULL DEFAULT 'MEDIUM',
    "assignedTo" UUID,
    "tags" JSONB,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id"),
    CONSTRAINT "feedback_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "profiles"("id")
);

CREATE TABLE IF NOT EXISTS "feedback_responses" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "feedbackId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feedback_responses_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedback"("id"),
    CONSTRAINT "feedback_responses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id")
);

CREATE TABLE IF NOT EXISTS "announcements" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "AnnouncementType" NOT NULL DEFAULT 'INFO',
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'NORMAL',
    "targetAudience" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "announcements_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "profiles"("id")
);

CREATE TABLE IF NOT EXISTS "announcement_views" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "announcementId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "announcement_views_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id"),
    CONSTRAINT "announcement_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id")
);

DO $$ BEGIN
    ALTER TABLE "announcement_views" ADD CONSTRAINT "announcement_views_announcementId_userId_key" UNIQUE("announcementId", "userId");
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "reports" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "reporterId" UUID NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" UUID NOT NULL,
    "targetUser" UUID,
    "reason" "ReportReason" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "evidence" JSONB,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "ReportPriority" NOT NULL DEFAULT 'MEDIUM',
    "assignedTo" UUID,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "profiles"("id"),
    CONSTRAINT "reports_targetUser_fkey" FOREIGN KEY ("targetUser") REFERENCES "profiles"("id"),
    CONSTRAINT "reports_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "profiles"("id")
);

CREATE TABLE IF NOT EXISTS "user_sessions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "sessionId" TEXT UNIQUE NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" JSONB,
    "device" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id")
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" UUID,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id")
);

CREATE TABLE IF NOT EXISTS "system_metrics" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "tags" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_listings_categoryId_type_createdAt" ON "listings"("categoryId", "type", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_chats_listingId_buyerId_sellerId" ON "chats"("listingId", "buyerId", "sellerId");
CREATE INDEX IF NOT EXISTS "idx_messages_chatId_createdAt" ON "messages"("chatId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_offers_chatId_createdAt" ON "offers"("chatId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_transactions_buyerId_sellerId_listingId_status" ON "transactions"("buyerId", "sellerId", "listingId", "status");
CREATE INDEX IF NOT EXISTS "idx_reviews_reviewerId_revieweeId" ON "reviews"("reviewerId", "revieweeId");
CREATE INDEX IF NOT EXISTS "idx_disputes_status_createdAt" ON "disputes"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_disputes_priority_status" ON "disputes"("priority", "status");
CREATE INDEX IF NOT EXISTS "idx_events_status_startTime" ON "events"("status", "startTime");
CREATE INDEX IF NOT EXISTS "idx_events_creatorId" ON "events"("creatorId");
CREATE INDEX IF NOT EXISTS "idx_trophies_userId_category" ON "trophies"("userId", "category");
CREATE INDEX IF NOT EXISTS "idx_badges_userId_type" ON "badges"("userId", "type");
CREATE INDEX IF NOT EXISTS "idx_projects_userId_category_status" ON "projects"("userId", "category", "status");
CREATE INDEX IF NOT EXISTS "idx_papers_userId_category" ON "papers"("userId", "category");
CREATE INDEX IF NOT EXISTS "idx_clubs_category_isActive" ON "clubs"("category", "isActive");
CREATE INDEX IF NOT EXISTS "idx_club_memberships_clubId_role" ON "club_memberships"("clubId", "role");
CREATE INDEX IF NOT EXISTS "idx_notifications_userId_isRead_createdAt" ON "notifications"("userId", "isRead", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_notifications_type_priority" ON "notifications"("type", "priority");
CREATE INDEX IF NOT EXISTS "idx_analytics_eventType_eventName_createdAt" ON "analytics"("eventType", "eventName", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_analytics_userId_createdAt" ON "analytics"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_feedback_type_status_priority" ON "feedback"("type", "status", "priority");
CREATE INDEX IF NOT EXISTS "idx_feedback_userId_createdAt" ON "feedback"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_feedback_responses_feedbackId_createdAt" ON "feedback_responses"("feedbackId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_announcements_type_priority_isActive" ON "announcements"("type", "priority", "isActive");
CREATE INDEX IF NOT EXISTS "idx_announcements_startDate_endDate" ON "announcements"("startDate", "endDate");
CREATE INDEX IF NOT EXISTS "idx_reports_status_priority_createdAt" ON "reports"("status", "priority", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_reports_targetType_targetId" ON "reports"("targetType", "targetId");
CREATE INDEX IF NOT EXISTS "idx_reports_reporterId_createdAt" ON "reports"("reporterId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_userId_isActive" ON "user_sessions"("userId", "isActive");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_sessionId" ON "user_sessions"("sessionId");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_userId_action_createdAt" ON "audit_logs"("userId", "action", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_resource_resourceId" ON "audit_logs"("resource", "resourceId");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action_createdAt" ON "audit_logs"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_system_metrics_name_timestamp" ON "system_metrics"("name", "timestamp");