import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { logAdminAction, ADMIN_ACTIONS } from "@/lib/admin-logger"
import { z } from "zod"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

const backupSchema = z.object({
  type: z.enum(["FULL", "USERS", "TRANSACTIONS", "LISTINGS", "SETTINGS"]),
  format: z.enum(["JSON", "CSV"]).default("JSON"),
  includeFiles: z.boolean().default(false),
  dateRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional()
  }).optional()
})

const exportSchema = z.object({
  entity: z.enum(["USERS", "TRANSACTIONS", "LISTINGS", "REVIEWS", "DISPUTES"]),
  format: z.enum(["JSON", "CSV", "XLSX"]),
  filters: z.record(z.any()).optional(),
  fields: z.array(z.string()).optional()
})

export const GET = withAdminAuth(async (request: NextRequest, user) => {
  await logAdminAction({
    adminId: user.id,
    action: "VIEW_BACKUP_STATUS",
    request
  })

  try {
    // Get backup history from audit logs
    const backupHistory = await prisma.auditLog.findMany({
      where: {
        action: { in: ["BACKUP_CREATED", "EXPORT_GENERATED"] }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    })

    // Get system statistics for backup planning
    const systemStats = await Promise.all([
      // Record counts only - no fake size calculations
      Promise.all([
        prisma.profile.count(),
        prisma.listing.count(),
        prisma.transaction.count(),
        prisma.message.count(),
        prisma.review.count(),
        prisma.dispute.count(),
        prisma.auditLog.count()
      ]).then(counts => [
        { tablename: 'profiles', record_count: counts[0] },
        { tablename: 'listings', record_count: counts[1] },
        { tablename: 'transactions', record_count: counts[2] },
        { tablename: 'messages', record_count: counts[3] },
        { tablename: 'reviews', record_count: counts[4] },
        { tablename: 'disputes', record_count: counts[5] },
        { tablename: 'audit_logs', record_count: counts[6] }
      ].sort((a, b) => b.record_count - a.record_count)),
      
      // Record counts by table
      Promise.all([
        prisma.profile.count(),
        prisma.listing.count(),
        prisma.transaction.count(),
        prisma.review.count(),
        prisma.dispute.count(),
        prisma.message.count(),
        prisma.auditLog.count()
      ])
    ])

    // Calculate estimated backup sizes
    const recordCounts = {
      profiles: systemStats[1][0],
      listings: systemStats[1][1],
      transactions: systemStats[1][2],
      reviews: systemStats[1][3],
      disputes: systemStats[1][4],
      messages: systemStats[1][5],
      auditLogs: systemStats[1][6]
    }

    return successResponse({
      backupHistory,
      systemStats: {
        tableInfo: systemStats[0],
        recordCounts
      },
      availableBackups: [
        {
          type: "FULL",
          description: "Complete database backup including all tables",
          recordCount: Object.values(recordCounts).reduce((sum, count) => sum + count, 0)
        },
        {
          type: "USERS",
          description: "User profiles and authentication data",
          recordCount: recordCounts.profiles
        },
        {
          type: "TRANSACTIONS",
          description: "All transaction and payment data",
          recordCount: recordCounts.transactions
        },
        {
          type: "LISTINGS",
          description: "Product listings and related data",
          recordCount: recordCounts.listings
        },
        {
          type: "SETTINGS",
          description: "System settings and configuration",
          recordCount: 0
        }
      ]
    })
  } catch (error) {
    console.error("Error fetching backup status:", error)
    return errorResponse(error, 500)
  }
})

// POST /api/admin/system/backup - Create backup
export const POST = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = backupSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid backup configuration")
    }

    const { type, format, includeFiles, dateRange } = parsed.data

    // Build date filter if provided
    const dateFilter = dateRange ? {
      createdAt: {
        ...(dateRange.start && { gte: new Date(dateRange.start) }),
        ...(dateRange.end && { lte: new Date(dateRange.end) })
      }
    } : {}

    let backupData: any = {}
    let recordCount = 0

    switch (type) {
      case "FULL":
        // Export all data (in real app, you'd use proper backup tools)
        const [profiles, listings, transactions, reviews, disputes, messages] = await Promise.all([
          prisma.profile.findMany({ where: dateFilter }),
          prisma.listing.findMany({ where: dateFilter }),
          prisma.transaction.findMany({ where: dateFilter }),
          prisma.review.findMany({ where: dateFilter }),
          prisma.dispute.findMany({ where: dateFilter }),
          prisma.message.findMany({ where: dateFilter })
        ])
        
        backupData = {
          profiles,
          listings,
          transactions,
          reviews,
          disputes,
          messages,
          metadata: {
            exportedAt: new Date(),
            exportedBy: user.id,
            type: "FULL",
            version: "1.0"
          }
        }
        recordCount = profiles.length + listings.length + transactions.length + reviews.length + disputes.length + messages.length
        break

      case "USERS":
        const users = await prisma.profile.findMany({
          where: dateFilter,
          include: {
            _count: {
              select: {
                listings: true,
                purchases: true,
                sales: true,
                reviewsGiven: true
              }
            }
          }
        })
        backupData = { users, metadata: { exportedAt: new Date(), exportedBy: user.id, type: "USERS" } }
        recordCount = users.length
        break

      case "TRANSACTIONS":
        const transactionData = await prisma.transaction.findMany({
          where: dateFilter,
          include: {
            listing: { 
              select: { 
                title: true, 
                category: { select: { name: true } }
              } 
            },
            buyer: { select: { name: true, email: true } },
            seller: { select: { name: true, email: true } }
          }
        })
        backupData = { transactions: transactionData, metadata: { exportedAt: new Date(), exportedBy: user.id, type: "TRANSACTIONS" } }
        recordCount = transactionData.length
        break

      case "LISTINGS":
        const listingData = await prisma.listing.findMany({
          where: dateFilter,
          include: {
            user: { select: { name: true, email: true } },
            _count: {
              select: {
                transactions: true,
                chats: true
              }
            }
          }
        })
        backupData = { listings: listingData, metadata: { exportedAt: new Date(), exportedBy: user.id, type: "LISTINGS" } }
        recordCount = listingData.length
        break

      case "SETTINGS":
        // Settings data would come from a settings table when implemented
        const settingsData: any[] = []
        backupData = { settings: settingsData, metadata: { exportedAt: new Date(), exportedBy: user.id, type: "SETTINGS" } }
        recordCount = settingsData.length
        break
    }

    // In a real application, you would:
    // 1. Save the backup to cloud storage (S3, etc.)
    // 2. Compress the data
    // 3. Encrypt sensitive information
    // 4. Generate a download link with expiration

    const backupId = `backup_${type.toLowerCase()}_${Date.now()}`
    const backupSize = JSON.stringify(backupData).length

    // Log the backup creation
    await logAdminAction({
      adminId: user.id,
      action: "BACKUP_CREATED",
      details: {
        backupId,
        type,
        format,
        recordCount,
        size: backupSize,
        includeFiles
      },
      request
    })

    // In production, return a download URL instead of the data
    return successResponse({
      backupId,
      type,
      format,
      recordCount,
      size: backupSize,
      createdAt: new Date(),
      createdBy: user.id,
      downloadUrl: `/api/admin/system/backup/${backupId}/download`, // Would be implemented
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      // For demo purposes, include a sample of the data
      sampleData: format === "JSON" ? 
        Object.keys(backupData).reduce((sample, key) => {
          if (key !== "metadata" && Array.isArray(backupData[key])) {
            sample[key] = backupData[key].slice(0, 3) // First 3 records
          }
          return sample
        }, {} as any) : null
    })
  } catch (error) {
    console.error("Error creating backup:", error)
    return errorResponse(error, 500)
  }
})

// PUT /api/admin/system/backup/export - Export specific data
export const PUT = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = exportSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid export configuration")
    }

    const { entity, format, filters, fields } = parsed.data

    let exportData: any[] = []
    let totalRecords = 0

    // Build query based on entity and filters
    switch (entity) {
      case "USERS":
        const userQuery = {
          where: filters || {},
          ...(fields && { select: fields.reduce((acc, field) => ({ ...acc, [field]: true }), {}) })
        }
        exportData = await prisma.profile.findMany(userQuery)
        totalRecords = await prisma.profile.count({ where: filters || {} })
        break

      case "TRANSACTIONS":
        const transactionQuery = {
          where: filters || {},
          include: {
            listing: { select: { title: true, category: true } },
            buyer: { select: { name: true, email: true } }
          }
        }
        exportData = await prisma.transaction.findMany(transactionQuery)
        totalRecords = await prisma.transaction.count({ where: filters || {} })
        break

      case "LISTINGS":
        const listingQuery = {
          where: filters || {},
          include: {
            user: { select: { name: true, email: true } }
          }
        }
        exportData = await prisma.listing.findMany(listingQuery)
        totalRecords = await prisma.listing.count({ where: filters || {} })
        break

      case "REVIEWS":
        exportData = await prisma.review.findMany({
          where: filters || {},
          include: {
            reviewer: { select: { name: true } },
            reviewee: { select: { name: true } }
          }
        })
        totalRecords = await prisma.review.count({ where: filters || {} })
        break

      case "DISPUTES":
        exportData = await prisma.dispute.findMany({
          where: filters || {},
          include: {
            transaction: {
              include: {
                listing: { select: { title: true } }
              }
            }
          }
        })
        totalRecords = await prisma.dispute.count({ where: filters || {} })
        break
    }

    const exportId = `export_${entity.toLowerCase()}_${Date.now()}`

    // Log the export
    await logAdminAction({
      adminId: user.id,
      action: "EXPORT_GENERATED",
      details: {
        exportId,
        entity,
        format,
        recordCount: exportData.length,
        totalRecords,
        filters
      },
      request
    })

    return successResponse({
      exportId,
      entity,
      format,
      recordCount: exportData.length,
      totalRecords,
      createdAt: new Date(),
      createdBy: user.id,
      downloadUrl: `/api/admin/system/export/${exportId}/download`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      // Sample data for preview
      sampleData: exportData.slice(0, 5)
    })
  } catch (error) {
    console.error("Error generating export:", error)
    return errorResponse(error, 500)
  }
})