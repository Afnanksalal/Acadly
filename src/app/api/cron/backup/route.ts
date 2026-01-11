import { NextRequest } from "next/server"
import { createBackup, cleanupOldBackups, getBackupStats } from "@/lib/backup"
import { successResponse, errorResponse } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"

/**
 * Automated backup cron job
 * 
 * Vercel Scheduling:
 * - Daily at 2 AM UTC: 0 2 * * *
 * - Weekly full backup on Sunday: 0 3 * * 0
 * 
 * Manual trigger: GET /api/cron/backup with Authorization Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const jobId = `backup_job_${Date.now()}`
  
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return errorResponse(new Error("Unauthorized"), 401)
    }

    console.log(`[${jobId}] Starting automated backup job...`)

    const { searchParams } = new URL(request.url)
    const backupType = (searchParams.get("type") || "FULL") as "FULL" | "USERS" | "TRANSACTIONS" | "LISTINGS" | "MESSAGES" | "AUDIT_LOGS"
    const cleanup = searchParams.get("cleanup") !== "false"
    const retentionDays = parseInt(searchParams.get("retention") || "30")

    // Get system user ID for backup (or use null for system operations)
    const systemAdmin = await prisma.profile.findFirst({
      where: { role: "ADMIN" },
      select: { id: true }
    })

    const createdBy = systemAdmin?.id || "system"

    // Create backup
    console.log(`[${jobId}] Creating ${backupType} backup...`)
    const backupResult = await createBackup({
      type: backupType,
      format: "JSON",
      createdBy
    })

    console.log(`[${jobId}] Backup created: ${backupResult.fileName} (${backupResult.recordCount} records)`)

    // Cleanup old backups if enabled
    let cleanupResult = { deleted: 0 }
    if (cleanup) {
      console.log(`[${jobId}] Cleaning up backups older than ${retentionDays} days...`)
      cleanupResult = await cleanupOldBackups(retentionDays)
      console.log(`[${jobId}] Cleaned up ${cleanupResult.deleted} old backups`)
    }

    // Get current stats
    const stats = await getBackupStats()

    // Log the cron job execution
    await prisma.auditLog.create({
      data: {
        action: "CRON_BACKUP_COMPLETED",
        resource: "SYSTEM",
        metadata: {
          jobId,
          backupId: backupResult.id,
          backupType,
          recordCount: backupResult.recordCount,
          fileSize: backupResult.size,
          cleanedUp: cleanupResult.deleted,
          totalBackups: stats.totalBackups
        }
      }
    })

    console.log(`[${jobId}] Backup job completed successfully`)

    return successResponse({
      jobId,
      backup: {
        id: backupResult.id,
        type: backupResult.type,
        fileName: backupResult.fileName,
        recordCount: backupResult.recordCount,
        size: backupResult.size
      },
      cleanup: {
        enabled: cleanup,
        retentionDays,
        deleted: cleanupResult.deleted
      },
      stats: {
        totalBackups: stats.totalBackups,
        totalSize: stats.totalSize
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error(`[${jobId}] Backup job failed:`, error)
    
    // Log failure
    await prisma.auditLog.create({
      data: {
        action: "CRON_BACKUP_FAILED",
        resource: "SYSTEM",
        metadata: {
          jobId,
          error: error instanceof Error ? error.message : "Unknown error"
        }
      }
    }).catch(() => {})

    return errorResponse(error, 500)
  }
}

// Also allow POST for manual triggers
export const POST = GET
