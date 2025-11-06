'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Flag, Eye, CheckCircle, XCircle } from 'lucide-react'

interface ReportData {
  id: string
  targetType: string
  reason: string
  description: string | null
  status: string
  priority: string
  createdAt: string
  reporter: {
    email: string
    name: string | null
  }
  reportedUser?: {
    email: string
    name: string | null
  }
}

interface ModerationStats {
  pendingReports: number
  flaggedContent: number
  approvedToday: number
  removedToday: number
}

export function ContentModeration() {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [reports, setReports] = useState<ReportData[]>([])
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
    fetchStats()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports')
      if (response.ok) {
        const result = await response.json()
        setReports(result.data || [])
      } else {
        console.error('Failed to fetch reports:', response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    }
  }

  const fetchStats = async () => {
    try {
      // Get stats from reports API
      const [allReports, pendingReports] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/reports?status=PENDING')
      ])

      if (allReports.ok && pendingReports.ok) {
        const allResult = await allReports.json()
        const pendingResult = await pendingReports.json()
        
        setStats({
          pendingReports: pendingResult.data?.length || 0,
          flaggedContent: allResult.data?.filter((r: any) => r.status === 'INVESTIGATING').length || 0,
          approvedToday: allResult.data?.filter((r: any) => 
            r.status === 'RESOLVED' && 
            new Date(r.updatedAt).toDateString() === new Date().toDateString()
          ).length || 0,
          removedToday: allResult.data?.filter((r: any) => 
            r.status === 'DISMISSED' && 
            new Date(r.updatedAt).toDateString() === new Date().toDateString()
          ).length || 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleModerationAction = async (action: string, itemIds: string[]) => {
    if (itemIds.length === 0) return
    
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} ${itemIds.length} reports?`)) {
      return
    }

    try {
      // Update report status based on action
      const statusMap: Record<string, string> = {
        'APPROVE': 'RESOLVED',
        'REJECT': 'DISMISSED', 
        'FLAG': 'INVESTIGATING',
        'RESOLVE': 'RESOLVED',
        'DISMISS': 'DISMISSED'
      }

      const newStatus = statusMap[action] || 'PENDING'

      const updatePromises = itemIds.map(reportId =>
        fetch(`/api/reports/${reportId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            resolution: `${action} by administrator`
          })
        })
      )

      await Promise.all(updatePromises)
      
      setSelectedItems([])
      fetchReports() // Refresh the list
      fetchStats() // Refresh stats
      alert(`Successfully ${action.toLowerCase()}ed ${itemIds.length} reports`)
    } catch (error) {
      console.error('Moderation action failed:', error)
      alert('Moderation action failed')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'secondary'
      case 'LOW': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold">Content Moderation</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Flag className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-red-400">
              {loading ? '...' : stats?.pendingReports || 0}
            </div>
            <p className="text-xs text-muted-foreground">Require review</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Flagged Content</CardTitle>
            <Eye className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-yellow-400">
              {loading ? '...' : stats?.flaggedContent || 0}
            </div>
            <p className="text-xs text-muted-foreground">Auto-flagged items</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-400">
              {loading ? '...' : stats?.approvedToday || 0}
            </div>
            <p className="text-xs text-muted-foreground">Content approved</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Removed Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-red-400">
              {loading ? '...' : stats?.removedToday || 0}
            </div>
            <p className="text-xs text-muted-foreground">Content removed</p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card className="hover-lift">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Bulk Actions ({selectedItems.length} selected)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleModerationAction('APPROVE', selectedItems)}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                Approve
              </Button>
              <Button
                onClick={() => handleModerationAction('REJECT', selectedItems)}
                variant="destructive"
                size="sm"
              >
                Reject
              </Button>
              <Button
                onClick={() => handleModerationAction('FLAG', selectedItems)}
                variant="outline"
                size="sm"
              >
                Flag for Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Moderation Queue */}
      <Card className="hover-lift">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle>Moderation Queue</CardTitle>
          <CardDescription>Review reported content and take appropriate actions</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center p-3 sm:p-4 border border-primary/10 rounded-lg bg-muted/20 animate-pulse">
                  <div className="w-4 h-4 bg-muted rounded mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-48 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-64 mb-1"></div>
                    <div className="h-3 bg-muted rounded w-32"></div>
                  </div>
                </div>
              ))
            ) : reports.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
                <p className="text-lg font-medium mb-2">All Clear!</p>
                <p className="text-sm text-muted-foreground">No pending reports to review</p>
              </div>
            ) : reports.map((report) => (
              <div key={report.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 sm:p-4 border border-primary/10 rounded-lg bg-muted/20 gap-3">
                <div className="flex items-start gap-3 sm:gap-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(report.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems([...selectedItems, report.id])
                      } else {
                        setSelectedItems(selectedItems.filter(id => id !== report.id))
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm sm:text-base">{report.targetType} Report</h4>
                      <Badge variant={getPriorityColor(report.priority)}>
                        {report.priority}
                      </Badge>
                      <Badge variant="outline">
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Reported by: {report.reporter.name || report.reporter.email} • Reason: {report.reason}
                    </p>
                    {report.description && (
                      <p className="text-sm text-muted-foreground mt-1">&ldquo;{report.description}&rdquo;</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 lg:flex-shrink-0">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Review
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-xs"
                    onClick={() => handleModerationAction('RESOLVE', [report.id])}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Resolve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleModerationAction('DISMISS', [report.id])}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}