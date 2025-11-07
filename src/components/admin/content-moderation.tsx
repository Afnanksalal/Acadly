'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Flag, Eye, CheckCircle } from 'lucide-react'
import { ReportResolutionDialog } from './report-resolution-dialog'
import { DisputeResolutionDialog } from './dispute-resolution-dialog'
import { ListingsManagement } from './listings-management'

interface ReportData {
  id: string
  targetType: string
  targetId: string
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
    id: string
    email: string
    name: string | null
  }
}

interface DisputeData {
  id: string
  subject: string
  description: string
  reason: string
  status: string
  priority: string
  createdAt: string
  transaction: {
    id: string
    amount: number
    listing: {
      title: string
      price: number
    }
    buyer: {
      email: string
      name: string | null
    }
    seller: {
      email: string
      name: string | null
    }
  }
}

interface ModerationStats {
  pendingReports: number
  openDisputes: number
  totalResolved: number
}

export function ContentModeration() {
  const [reports, setReports] = useState<ReportData[]>([])
  const [disputes, setDisputes] = useState<DisputeData[]>([])
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'reports' | 'disputes' | 'listings'>('reports')
  
  // Dialogs
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null)
  const [selectedDispute, setSelectedDispute] = useState<DisputeData | null>(null)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false)

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports')
      if (response.ok) {
        const result = await response.json()
        const reports = result.data?.reports || result.reports || []
        setReports(Array.isArray(reports) ? reports : [])
      } else {
        setReports([])
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
      setReports([])
    }
  }

  const fetchDisputes = async () => {
    try {
      const response = await fetch('/api/admin/disputes')
      if (response.ok) {
        const result = await response.json()
        const disputesList = Array.isArray(result.data?.disputes) ? result.data.disputes :
                            Array.isArray(result.disputes) ? result.disputes : []
        setDisputes(disputesList)
      }
    } catch (error) {
      console.error('Failed to fetch disputes:', error)
      setDisputes([])
    }
  }

  const fetchStats = async () => {
    try {
      const [allReports, allDisputes] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/admin/disputes')
      ])

      if (allReports.ok && allDisputes.ok) {
        const reportsResult = await allReports.json()
        const disputesResult = await allDisputes.json()
        
        const allReportsList = Array.isArray(reportsResult.data?.reports) ? reportsResult.data.reports : 
                               Array.isArray(reportsResult.reports) ? reportsResult.reports : []
        const disputesList = Array.isArray(disputesResult.data?.disputes) ? disputesResult.data.disputes :
                            Array.isArray(disputesResult.disputes) ? disputesResult.disputes : []
        
        setStats({
          pendingReports: allReportsList.filter((r: any) => r.status === 'PENDING').length,
          openDisputes: disputesList.filter((d: any) => d.status === 'OPEN' || d.status === 'IN_REVIEW').length,
          totalResolved: [
            ...allReportsList.filter((r: any) => r.status === 'RESOLVED'),
            ...disputesList.filter((d: any) => d.status === 'RESOLVED')
          ].length
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setStats({ pendingReports: 0, openDisputes: 0, totalResolved: 0 })
    }
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchReports(), fetchDisputes(), fetchStats()])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleOpenReportDialog = (report: ReportData) => {
    setSelectedReport(report)
    setReportDialogOpen(true)
  }

  const handleOpenDisputeDialog = (dispute: DisputeData) => {
    setSelectedDispute(dispute)
    setDisputeDialogOpen(true)
  }

  const handleResolved = () => {
    fetchData()
  }

  const handleDisputeAction = async (action: string, disputeId: string, resolution: string) => {
    try {
      const response = await fetch(`/api/admin/disputes/${disputeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action === 'RESOLVE' ? 'RESOLVED' : 'REJECTED',
          resolution
        })
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Failed to update dispute:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'destructive'
      case 'HIGH': return 'destructive'
      case 'URGENT': return 'destructive'
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

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Reports ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('disputes')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'disputes'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Disputes ({disputes.length})
        </button>
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'listings'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Listings
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Flag className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-red-400">
              {loading ? '...' : stats?.pendingReports || 0}
            </div>
            <p className="text-xs text-muted-foreground">Need review</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
            <Shield className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-yellow-400">
              {loading ? '...' : stats?.openDisputes || 0}
            </div>
            <p className="text-xs text-muted-foreground">Require action</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium">Total Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-green-400">
              {loading ? '...' : stats?.totalResolved || 0}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'reports' ? (
        <Card className="hover-lift">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Reports Queue</CardTitle>
            <CardDescription>Review reported content and take appropriate actions</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center p-3 sm:p-4 border border-primary/10 rounded-lg bg-muted/20 animate-pulse">
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
                <div className="flex flex-wrap gap-2 lg:flex-shrink-0">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-xs"
                    onClick={() => handleOpenReportDialog(report)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      ) : (
        /* Disputes Queue */
        <Card className="hover-lift">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Disputes Queue</CardTitle>
            <CardDescription>Review and resolve transaction disputes</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center p-3 sm:p-4 border border-primary/10 rounded-lg bg-muted/20 animate-pulse">
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-48 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-64"></div>
                    </div>
                  </div>
                ))
              ) : disputes.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
                  <p className="text-lg font-medium mb-2">All Clear!</p>
                  <p className="text-sm text-muted-foreground">No pending disputes to review</p>
                </div>
              ) : disputes.map((dispute) => (
                <div key={dispute.id} className="p-3 sm:p-4 border border-primary/10 rounded-lg bg-muted/20">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h4 className="font-medium text-sm sm:text-base">{dispute.subject}</h4>
                        <Badge variant={getPriorityColor(dispute.priority)}>
                          {dispute.priority}
                        </Badge>
                        <Badge variant="outline">
                          {dispute.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Transaction: {dispute.transaction.listing.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Buyer: {dispute.transaction.buyer.name || dispute.transaction.buyer.email} • 
                        Seller: {dispute.transaction.seller.name || dispute.transaction.seller.email}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Reason: {dispute.reason.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Filed {new Date(dispute.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:flex-shrink-0">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-xs"
                        onClick={() => handleOpenDisputeDialog(dispute)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listings Tab */}
      {activeTab === 'listings' && (
        <ListingsManagement />
      )}

      {/* Dialogs */}
      <ReportResolutionDialog
        report={selectedReport}
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        onResolved={handleResolved}
      />

      <DisputeResolutionDialog
        dispute={selectedDispute}
        open={disputeDialogOpen}
        onClose={() => setDisputeDialogOpen(false)}
        onResolved={handleResolved}
      />
    </div>
  )
}
