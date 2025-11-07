'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  FileText, 
  User, 
  ShoppingBag, 
  CreditCard, 
  Flag, 
  Shield, 
  Settings,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface AuditLogEntry {
  id: string
  userId: string | null
  action: string
  resource: string
  resourceId: string | null
  oldValues: any
  newValues: any
  ipAddress: string | null
  userAgent: string | null
  metadata: any
  createdAt: string
  user: {
    email: string
    name: string | null
  } | null
}

const RESOURCE_ICONS: Record<string, any> = {
  USER: User,
  LISTING: ShoppingBag,
  TRANSACTION: CreditCard,
  REPORT: Flag,
  DISPUTE: Shield,
  SYSTEM: Settings,
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  LOGIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  LOGOUT: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
}

export function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    action: '',
    resource: '',
    userId: '',
    search: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [page, filters])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filters.action && { action: filters.action }),
        ...(filters.resource && { resource: filters.resource }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.search && { search: filters.search })
      })

      const response = await fetch(`/api/admin/audit-logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.data?.logs || data.logs || [])
        setTotalPages(data.data?.totalPages || data.totalPages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getResourceIcon = (resource: string) => {
    const Icon = RESOURCE_ICONS[resource] || FileText
    return <Icon className="h-4 w-4" />
  }

  const getActionColor = (action: string) => {
    return ACTION_COLORS[action] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold">Audit Log</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="border-primary/10">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Action</label>
                <Select
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                >
                  <option value="">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="LOGIN">Login</option>
                  <option value="LOGOUT">Logout</option>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Resource</label>
                <Select
                  value={filters.resource}
                  onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
                >
                  <option value="">All Resources</option>
                  <option value="USER">User</option>
                  <option value="LISTING">Listing</option>
                  <option value="TRANSACTION">Transaction</option>
                  <option value="REPORT">Report</option>
                  <option value="DISPUTE">Dispute</option>
                  <option value="SYSTEM">System</option>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">User ID</label>
                <Input
                  type="text"
                  placeholder="Filter by user..."
                  value={filters.userId}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search logs..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ action: '', resource: '', userId: '', search: '' })}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setPage(1)
                  fetchLogs()
                }}
              >
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs List */}
      <Card className="hover-lift">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Complete audit trail of all system actions</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center p-3 sm:p-4 border border-primary/10 rounded-lg bg-muted/20 animate-pulse">
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-48 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-64"></div>
                  </div>
                </div>
              ))
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-lg font-medium mb-2">No audit logs found</p>
                <p className="text-sm text-muted-foreground">
                  {Object.values(filters).some(v => v) ? 'Try adjusting your filters' : 'Logs will appear here as actions are performed'}
                </p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-primary/10 rounded-lg bg-muted/20 gap-3"
                >
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      {getResourceIcon(log.resource)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                        <Badge variant="outline">
                          {log.resource}
                        </Badge>
                        {log.resourceId && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {log.resourceId.substring(0, 8)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {log.user ? (
                          <>
                            <span className="font-medium text-foreground">
                              {log.user.name || log.user.email}
                            </span>
                            {' '}performed this action
                          </>
                        ) : (
                          'System action'
                        )}
                      </p>
                      {log.ipAddress && (
                        <p className="text-xs text-muted-foreground mt-1">
                          IP: {log.ipAddress}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground sm:text-right shrink-0">
                    {formatDate(log.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
