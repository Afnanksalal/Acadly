import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { logAdminAction } from "@/lib/admin-logger"
import { z } from "zod"
import {
  createBackup,
  listBackups,
  getBackupDownloadUrl,
  deleteBackup,
  cleanupOldBackups,
  getBackupStats,
  type BackupType,
  type BackupFormat
} from "@/lib/backup"

export const dynamic = 'force-dynamic'

const createBackupSchema = z.object({
  type: z.enum(["FULL", "USERS", "TRANSACTIONS", "LISTINGS", "MESSAGES", "AUDIT_LOGS"]),
  format: z.enum(["JSON", "CSV"]).default("JSON"),
  dateRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional()
  }).optional()
})

const downloadSchema = z.object({
  filePath: z.string().min(1)
})

const deleteSchema = z.object({
  filePath: z.string().min(1)
})

const cleanupSchema = z.object({
  retentionDays: z.number().int().min(1).max(365).default(30)
})

/**
 * GET /api/admin/system/backup
 * Get backup status, history, and statistics
 */
export const GET = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const filePath = searchParams.get('filePath')
    const type = searchParams.get('type') as BackupType | null

    // Handle download URL request
    if (action === 'download' && filePath) {
      const downloadUrl = await getBackupDownloadUrl(filePath)
      
      if (!downloadUrl) {
        return errorResponse(new Error('Failed to generate download URL'), 500)
      }

      await logAdminAction({
        adminId: user.id,
        action: "BACKUP_DOWNLOADED",
        details: { filePath },
        request
      })

      return successResponse({ downloadUrl, expiresIn: 3600 })
    }

    // Log view action
    await logAdminAction({
      adminId: user.id,
      action: "VIEW_BACKUP_STATUS",
      request
    })

    // Get backup list and stats
    const [backupList, stats, recentLogs] = await Promise.all([
      listBackups(type || undefined),
      getBackupStats(),
      prisma.auditLog.findMany({
        where: {
          action: { in: ["BACKUP_CREATED", "BACKUP_DELETED", "BACKUP_CLEANUP", "BACKUP_DOWNLOADED"] }
        },
        include: {
          user: { select: { id: true, email: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 20
      })
    ])

    // Get database record counts for backup planning
    const [
      profileCount,
      listingCount,
      transactionCount,
      messageCount,
      reviewCount,
      disputeCount,
      auditLogCount
    ] = await Promise.all([
      prisma.profile.count(),
      prisma.listing.count(),
      prisma.transaction.count(),
      prisma.message.count(),
      prisma.review.count(),
      prisma.dispute.count(),
      prisma.auditLog.count()
    ])

    const recordCounts = {
      profiles: profileCount,
      listings: listingCount,
      transactions: transactionCount,
      messages: messageCount,
      reviews: reviewCount,
      disputes: disputeCount,
      auditLogs: auditLogCount,
      total: profileCount + listingCount + transactionCount + messageCount + reviewCount + disputeCount + auditLogCount
    }

    return successResponse({
      backups: backupList.backups,
      stats: {
        ...stats,
        totalSizeFormatted: formatBytes(stats.totalSize)
      },
      recentActivity: recentLogs,
      recordCounts,
      availableBackupTypes: [
        {
          type: "FULL",
          description: "Complete database backup including all tables",
          estimatedRecords: recordCounts.total
        },
        {
          type: "USERS",
          description: "User profiles and account data",
          estimatedRecords: recordCounts.profiles
        },
        {
          type: "TRANSACTIONS",
          description: "All transactions and payment records",
          estimatedRecords: recordCounts.transactions
        },
        {
          type: "LISTINGS",
          description: "Product and service listings",
          estimatedRecords: recordCounts.listings
        },
        {
          type: "MESSAGES",
          description: "Chat messages and conversations",
          estimatedRecords: recordCounts.messages
        },
        {
          type: "AUDIT_LOGS",
          description: "System audit logs and activity",
          estimatedRecords: recordCounts.auditLogs
        }
      ]
    })
  } catch (error) {
    console.error("Error fetching backup status:", error)
    return errorResponse(error, 500)
  }
})

/**
 * POST /api/admin/system/backup
 * Create a new backup
 */
export const POST = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = createBackupSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid backup configuration", parsed.error.errors)
    }

    const { type, format, dateRange } = parsed.data

    // Create backup
    const result = await createBackup({
      type: type as BackupType,
      format: format as BackupFormat,
      dateRange: dateRange ? {
        start: dateRange.start ? new Date(dateRange.start) : undefined,
        end: dateRange.end ? new Date(dateRange.end) : undefined
      } : undefined,
      createdBy: user.id
    })

    await logAdminAction({
      adminId: user.id,
      action: "BACKUP_CREATED",
      details: {
        backupId: result.id,
        type: result.type,
        format: result.format,
        size: result.size,
        recordCount: result.recordCount
      },
      request
    })

    return successResponse({
      ...result,
      sizeFormatted: formatBytes(result.size),
      message: `Backup created successfully with ${result.recordCount} records`
    }, 201)
  } catch (error) {
    console.error("Error creating backup:", error)
    return errorResponse(error, 500)
  }
})

/**
 * DELETE /api/admin/system/backup
 * Delete a backup or cleanup old backups
 */
export const DELETE = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // Cleanup old backups
    if (action === 'cleanup') {
      const body = await request.json().catch(() => ({}))
      const parsed = cleanupSchema.safeParse(body)
      const retentionDays = parsed.success ? parsed.data.retentionDays : 30

      const result = await cleanupOldBackups(retentionDays)

      await logAdminAction({
        adminId: user.id,
        action: "BACKUP_CLEANUP",
        details: { retentionDays, deletedCount: result.deleted },
        request
      })

      return successResponse({
        deleted: result.deleted,
        retentionDays,
        message: `Cleaned up ${result.deleted} backups older than ${retentionDays} days`
      })
    }

    // Delete specific backup
    const body = await request.json()
    const parsed = deleteSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid delete request", parsed.error.errors)
    }

    const { filePath } = parsed.data
    const success = await deleteBackup(filePath, user.id)

    if (!success) {
      return errorResponse(new Error('Failed to delete backup'), 500)
    }

    await logAdminAction({
      adminId: user.id,
      action: "BACKUP_DELETED",
      details: { filePath },
      request
    })

    return successResponse({
      deleted: true,
      filePath,
      message: 'Backup deleted successfully'
    })
  } catch (error) {
    console.error("Error deleting backup:", error)
    return errorResponse(error, 500)
  }
})

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
