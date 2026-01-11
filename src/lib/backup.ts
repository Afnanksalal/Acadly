/**
 * Backup System with Supabase Storage
 * 
 * Production-ready backup system that:
 * - Creates JSON/CSV backups of database tables
 * - Uploads backups to Supabase Storage
 * - Manages backup retention and cleanup
 * - Supports incremental and full backups
 * - Provides download URLs with expiration
 */

import { createClient } from '@supabase/supabase-js'
import { prisma } from './prisma'

// Supabase admin client for storage operations
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    throw new Error('Supabase credentials not configured for backup system')
  }
  
  return createClient(url, serviceKey, {
    auth: { persistSession: false }
  })
}

// Backup storage bucket name
const BACKUP_BUCKET = 'backups'

// Backup types
export type BackupType = 'FULL' | 'USERS' | 'TRANSACTIONS' | 'LISTINGS' | 'MESSAGES' | 'AUDIT_LOGS'
export type BackupFormat = 'JSON' | 'CSV'

export interface BackupOptions {
  type: BackupType
  format?: BackupFormat
  dateRange?: {
    start?: Date
    end?: Date
  }
  createdBy: string
}

export interface BackupResult {
  id: string
  type: BackupType
  format: BackupFormat
  fileName: string
  filePath: string
  size: number
  recordCount: number
  downloadUrl: string | null
  expiresAt: Date
  createdAt: Date
  createdBy: string
}

export interface BackupMetadata {
  id: string
  type: BackupType
  format: BackupFormat
  version: string
  createdAt: string
  createdBy: string
  recordCount: number
  tables: string[]
  dateRange?: {
    start?: string
    end?: string
  }
}

/**
 * Ensure backup bucket exists
 */
async function ensureBucketExists(): Promise<void> {
  const supabase = getSupabaseAdmin()
  
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === BACKUP_BUCKET)
  
  if (!bucketExists) {
    const { error } = await supabase.storage.createBucket(BACKUP_BUCKET, {
      public: false,
      fileSizeLimit: 100 * 1024 * 1024, // 100MB max
      allowedMimeTypes: ['application/json', 'text/csv', 'application/gzip']
    })
    
    if (error && !error.message.includes('already exists')) {
      throw new Error(`Failed to create backup bucket: ${error.message}`)
    }
  }
}

/**
 * Convert data to CSV format
 */
function toCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvRows = [headers.join(',')]
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header]
      if (value === null || value === undefined) return ''
      if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`
      return String(value)
    })
    csvRows.push(values.join(','))
  }
  
  return csvRows.join('\n')
}

/**
 * Fetch data for backup based on type
 */
async function fetchBackupData(
  type: BackupType,
  dateRange?: { start?: Date; end?: Date }
): Promise<{ data: Record<string, unknown>[]; tables: string[] }> {
  const dateFilter = dateRange ? {
    createdAt: {
      ...(dateRange.start && { gte: dateRange.start }),
      ...(dateRange.end && { lte: dateRange.end })
    }
  } : {}

  switch (type) {
    case 'FULL': {
      const [profiles, listings, transactions, reviews, disputes, messages, notifications] = await Promise.all([
        prisma.profile.findMany({ where: dateFilter }),
        prisma.listing.findMany({ where: dateFilter, include: { category: true } }),
        prisma.transaction.findMany({ where: dateFilter }),
        prisma.review.findMany({ where: dateFilter }),
        prisma.dispute.findMany({ where: dateFilter }),
        prisma.message.findMany({ where: dateFilter }),
        prisma.notification.findMany({ where: dateFilter })
      ])
      
      return {
        data: [
          { _table: 'profiles', _count: profiles.length, records: profiles },
          { _table: 'listings', _count: listings.length, records: listings },
          { _table: 'transactions', _count: transactions.length, records: transactions },
          { _table: 'reviews', _count: reviews.length, records: reviews },
          { _table: 'disputes', _count: disputes.length, records: disputes },
          { _table: 'messages', _count: messages.length, records: messages },
          { _table: 'notifications', _count: notifications.length, records: notifications }
        ],
        tables: ['profiles', 'listings', 'transactions', 'reviews', 'disputes', 'messages', 'notifications']
      }
    }
    
    case 'USERS': {
      const profiles = await prisma.profile.findMany({
        where: dateFilter,
        include: {
          _count: {
            select: { listings: true, purchases: true, sales: true, reviewsGiven: true, reviewsReceived: true }
          }
        }
      })
      return { data: profiles as unknown as Record<string, unknown>[], tables: ['profiles'] }
    }
    
    case 'TRANSACTIONS': {
      const transactions = await prisma.transaction.findMany({
        where: dateFilter,
        include: {
          listing: { select: { id: true, title: true, price: true } },
          buyer: { select: { id: true, email: true, name: true } },
          seller: { select: { id: true, email: true, name: true } },
          pickup: true
        }
      })
      return { data: transactions as unknown as Record<string, unknown>[], tables: ['transactions', 'pickups'] }
    }
    
    case 'LISTINGS': {
      const listings = await prisma.listing.findMany({
        where: dateFilter,
        include: {
          user: { select: { id: true, email: true, name: true } },
          category: true,
          _count: { select: { transactions: true, chats: true } }
        }
      })
      return { data: listings as unknown as Record<string, unknown>[], tables: ['listings'] }
    }
    
    case 'MESSAGES': {
      const messages = await prisma.message.findMany({
        where: dateFilter,
        include: {
          sender: { select: { id: true, email: true } },
          chat: { select: { id: true, listingId: true } }
        }
      })
      return { data: messages as unknown as Record<string, unknown>[], tables: ['messages'] }
    }
    
    case 'AUDIT_LOGS': {
      const logs = await prisma.auditLog.findMany({
        where: dateFilter,
        include: {
          user: { select: { id: true, email: true, role: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
      return { data: logs as unknown as Record<string, unknown>[], tables: ['audit_logs'] }
    }
    
    default:
      throw new Error(`Unknown backup type: ${type}`)
  }
}

/**
 * Create a backup and upload to Supabase Storage
 */
export async function createBackup(options: BackupOptions): Promise<BackupResult> {
  const { type, format = 'JSON', dateRange, createdBy } = options
  
  // Ensure bucket exists
  await ensureBucketExists()
  
  const supabase = getSupabaseAdmin()
  const backupId = `backup_${type.toLowerCase()}_${Date.now()}`
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `${type.toLowerCase()}_${timestamp}.${format.toLowerCase()}`
  const filePath = `${type.toLowerCase()}/${fileName}`
  
  // Fetch data
  const { data, tables } = await fetchBackupData(type, dateRange)
  const recordCount = Array.isArray(data) ? data.length : 
    (data as { records?: unknown[] }[]).reduce((sum, t) => sum + ((t.records as unknown[])?.length || 0), 0)
  
  // Create metadata
  const metadata: BackupMetadata = {
    id: backupId,
    type,
    format,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    createdBy,
    recordCount,
    tables,
    ...(dateRange && {
      dateRange: {
        start: dateRange.start?.toISOString(),
        end: dateRange.end?.toISOString()
      }
    })
  }
  
  // Prepare file content
  let fileContent: string
  let contentType: string
  
  if (format === 'CSV') {
    // For CSV, flatten the data
    const flatData = type === 'FULL' 
      ? (data as { records: Record<string, unknown>[] }[]).flatMap(t => t.records || [])
      : data
    fileContent = toCSV(flatData as Record<string, unknown>[])
    contentType = 'text/csv'
  } else {
    fileContent = JSON.stringify({ metadata, data }, null, 2)
    contentType = 'application/json'
  }
  
  const fileBuffer = Buffer.from(fileContent, 'utf-8')
  const fileSize = fileBuffer.length
  
  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BACKUP_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: false
    })
  
  if (uploadError) {
    throw new Error(`Failed to upload backup: ${uploadError.message}`)
  }
  
  // Generate signed URL (valid for 24 hours)
  const expiresIn = 24 * 60 * 60 // 24 hours in seconds
  const { data: urlData, error: urlError } = await supabase.storage
    .from(BACKUP_BUCKET)
    .createSignedUrl(filePath, expiresIn)
  
  if (urlError) {
    console.error('Failed to generate download URL:', urlError)
  }
  
  const expiresAt = new Date(Date.now() + expiresIn * 1000)
  
  // Log to audit
  await prisma.auditLog.create({
    data: {
      userId: createdBy,
      action: 'BACKUP_CREATED',
      resource: 'SYSTEM',
      metadata: {
        backupId,
        type,
        format,
        fileName,
        filePath,
        size: fileSize,
        recordCount,
        tables
      }
    }
  })
  
  return {
    id: backupId,
    type,
    format,
    fileName,
    filePath,
    size: fileSize,
    recordCount,
    downloadUrl: urlData?.signedUrl || null,
    expiresAt,
    createdAt: new Date(),
    createdBy
  }
}

/**
 * List all backups from storage
 */
export async function listBackups(type?: BackupType): Promise<{
  backups: Array<{
    name: string
    path: string
    size: number
    createdAt: string
    type: string
  }>
}> {
  const supabase = getSupabaseAdmin()
  
  try {
    await ensureBucketExists()
  } catch {
    return { backups: [] }
  }
  
  const folders = type ? [type.toLowerCase()] : ['full', 'users', 'transactions', 'listings', 'messages', 'audit_logs']
  const allBackups: Array<{
    name: string
    path: string
    size: number
    createdAt: string
    type: string
  }> = []
  
  for (const folder of folders) {
    const { data, error } = await supabase.storage
      .from(BACKUP_BUCKET)
      .list(folder, { sortBy: { column: 'created_at', order: 'desc' } })
    
    if (!error && data) {
      for (const file of data) {
        if (file.name && !file.name.startsWith('.')) {
          allBackups.push({
            name: file.name,
            path: `${folder}/${file.name}`,
            size: file.metadata?.size || 0,
            createdAt: file.created_at || '',
            type: folder.toUpperCase()
          })
        }
      }
    }
  }
  
  // Sort by creation date descending
  allBackups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  
  return { backups: allBackups }
}

/**
 * Get download URL for a backup
 */
export async function getBackupDownloadUrl(filePath: string): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  
  const { data, error } = await supabase.storage
    .from(BACKUP_BUCKET)
    .createSignedUrl(filePath, 60 * 60) // 1 hour
  
  if (error) {
    console.error('Failed to generate download URL:', error)
    return null
  }
  
  return data.signedUrl
}

/**
 * Delete a backup
 */
export async function deleteBackup(filePath: string, deletedBy: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  
  const { error } = await supabase.storage
    .from(BACKUP_BUCKET)
    .remove([filePath])
  
  if (error) {
    console.error('Failed to delete backup:', error)
    return false
  }
  
  // Log deletion
  await prisma.auditLog.create({
    data: {
      userId: deletedBy,
      action: 'BACKUP_DELETED',
      resource: 'SYSTEM',
      metadata: { filePath }
    }
  })
  
  return true
}

/**
 * Clean up old backups (retention policy)
 */
export async function cleanupOldBackups(retentionDays: number = 30): Promise<{ deleted: number }> {
  const supabase = getSupabaseAdmin()
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
  
  const { backups } = await listBackups()
  const toDelete: string[] = []
  
  for (const backup of backups) {
    if (new Date(backup.createdAt) < cutoffDate) {
      toDelete.push(backup.path)
    }
  }
  
  if (toDelete.length > 0) {
    const { error } = await supabase.storage
      .from(BACKUP_BUCKET)
      .remove(toDelete)
    
    if (error) {
      console.error('Failed to cleanup old backups:', error)
      return { deleted: 0 }
    }
    
    // Log cleanup
    await prisma.auditLog.create({
      data: {
        action: 'BACKUP_CLEANUP',
        resource: 'SYSTEM',
        metadata: { deletedCount: toDelete.length, retentionDays, files: toDelete }
      }
    })
  }
  
  return { deleted: toDelete.length }
}

/**
 * Get backup statistics
 */
export async function getBackupStats(): Promise<{
  totalBackups: number
  totalSize: number
  byType: Record<string, { count: number; size: number }>
  lastBackup: { type: string; createdAt: string } | null
}> {
  const { backups } = await listBackups()
  
  const byType: Record<string, { count: number; size: number }> = {}
  let totalSize = 0
  
  for (const backup of backups) {
    totalSize += backup.size
    
    if (!byType[backup.type]) {
      byType[backup.type] = { count: 0, size: 0 }
    }
    byType[backup.type].count++
    byType[backup.type].size += backup.size
  }
  
  return {
    totalBackups: backups.length,
    totalSize,
    byType,
    lastBackup: backups.length > 0 ? { type: backups[0].type, createdAt: backups[0].createdAt } : null
  }
}
