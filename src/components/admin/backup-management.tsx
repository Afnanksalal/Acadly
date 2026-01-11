'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { 
  Database, 
  Download, 
  Trash2, 
  RefreshCw, 
  Clock, 
  HardDrive,
  FileJson,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

interface Backup {
  name: string
  path: string
  size: number
  createdAt: string
  type: string
}

interface BackupStats {
  totalBackups: number
  totalSize: number
  totalSizeFormatted: string
  byType: Record<string, { count: number; size: number }>
  lastBackup: { type: string; createdAt: string } | null
}

interface BackupType {
  type: string
  description: string
  estimatedRecords: number
}

interface BackupData {
  backups: Backup[]
  stats: BackupStats
  availableBackupTypes: BackupType[]
  recordCounts: Record<string, number>
}

export function BackupManagement() {
  const [data, setData] = useState<BackupData | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('FULL')
  const [selectedFormat, setSelectedFormat] = useState<string>('JSON')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchBackupData()
  }, [])

  const fetchBackupData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/system/backup')
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      } else {
        setError('Failed to fetch backup data')
      }
    } catch (err) {
      setError('Failed to fetch backup data')
      console.error('Failed to fetch backup data:', err)
    } finally {
      setLoading(false)
    }
  }

  const createBackup = async () => {
    try {
      setCreating(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/admin/system/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          format: selectedFormat
        })
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(`Backup created successfully! ${result.data.recordCount} records exported.`)
        fetchBackupData()
      } else {
        setError(result.error || 'Failed to create backup')
      }
    } catch (err) {
      setError('Failed to create backup')
      console.error('Failed to create backup:', err)
    } finally {
      setCreating(false)
    }
  }

  const downloadBackup = async (filePath: string) => {
    try {
      const response = await fetch(`/api/admin/system/backup?action=download&filePath=${encodeURIComponent(filePath)}`)
      const result = await response.json()

      if (response.ok && result.data.downloadUrl) {
        window.open(result.data.downloadUrl, '_blank')
      } else {
        setError('Failed to generate download URL')
      }
    } catch (err) {
      setError('Failed to download backup')
      console.error('Failed to download backup:', err)
    }
  }

  const deleteBackup = async (filePath: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) return

    try {
      const response = await fetch('/api/admin/system/backup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      })

      if (response.ok) {
        setSuccess('Backup deleted successfully')
        fetchBackupData()
      } else {
        setError('Failed to delete backup')
      }
    } catch (err) {
      setError('Failed to delete backup')
      console.error('Failed to delete backup:', err)
    }
  }

  const cleanupOldBackups = async () => {
    if (!confirm('This will delete all backups older than 30 days. Continue?')) return

    try {
      const response = await fetch('/api/admin/system/backup?action=cleanup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retentionDays: 30 })
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(`Cleanup complete. ${result.data.deleted} old backups removed.`)
        fetchBackupData()
      } else {
        setError('Failed to cleanup backups')
      }
    } catch (err) {
      setError('Failed to cleanup backups')
      console.error('Failed to cleanup backups:', err)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Build options for Select components
  const typeOptions = data?.availableBackupTypes?.map((type) => ({
    value: type.type,
    label: `${type.type} (${type.estimatedRecords.toLocaleString()} records)`
  })) || []

  const formatOptions = [
    { value: 'JSON', label: 'JSON', icon: <FileJson className="h-4 w-4" /> },
    { value: 'CSV', label: 'CSV', icon: <FileSpreadsheet className="h-4 w-4" /> }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Backup Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Create and manage database backups</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchBackupData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-destructive hover:text-destructive/80 transition-colors">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 text-success border border-success/20">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm flex-1">{success}</span>
          <button onClick={() => setSuccess(null)} className="text-success hover:text-success/80 transition-colors">
            ×
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Backups</p>
                <p className="font-display text-2xl font-bold mt-1">
                  {loading ? '...' : data?.stats.totalBackups || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Database className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="font-display text-2xl font-bold mt-1">
                  {loading ? '...' : data?.stats.totalSizeFormatted || '0 Bytes'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/10">
                <HardDrive className="h-5 w-5 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Backup</p>
                <p className="font-mono text-sm font-medium mt-1 truncate">
                  {loading ? '...' : data?.stats.lastBackup 
                    ? formatDate(data.stats.lastBackup.createdAt)
                    : 'Never'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="font-display text-2xl font-bold mt-1">
                  {loading ? '...' : (data?.recordCounts?.total || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-success/10">
                <FileJson className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Backup */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Backup</CardTitle>
          <CardDescription>Export database data to Supabase Storage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select
                label="Backup Type"
                value={selectedType}
                onChange={setSelectedType}
                options={typeOptions}
                placeholder="Select backup type"
              />
            </div>

            <div className="w-full sm:w-40">
              <Select
                label="Format"
                value={selectedFormat}
                onChange={setSelectedFormat}
                options={formatOptions}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={createBackup} loading={creating} disabled={loading} glow>
                <Database className="h-4 w-4 mr-2" />
                Create Backup
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Backup History</CardTitle>
            <CardDescription>Manage existing backups stored in Supabase Storage</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={cleanupOldBackups}>
            <Trash2 className="h-4 w-4 mr-2" />
            Cleanup Old
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 opacity-50" />
              <p>Loading backups...</p>
            </div>
          ) : data?.backups && data.backups.length > 0 ? (
            <div className="space-y-3">
              {data.backups.map((backup, index) => (
                <div 
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 gap-3 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-card">
                      {backup.name.endsWith('.json') ? (
                        <FileJson className="h-5 w-5 text-primary" />
                      ) : (
                        <FileSpreadsheet className="h-5 w-5 text-success" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{backup.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(backup.createdAt)} • {formatBytes(backup.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {backup.type}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => downloadBackup(backup.path)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteBackup(backup.path)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No backups found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Create your first backup above</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
