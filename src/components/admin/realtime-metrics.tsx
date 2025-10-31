'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Users, DollarSign, AlertCircle } from 'lucide-react'

export function RealtimeMetrics() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRealtimeData()
    const interval = setInterval(fetchRealtimeData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchRealtimeData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/realtime')
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch realtime data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="p-3 sm:p-4">
              <div className="h-4 bg-muted rounded w-24 sm:w-32"></div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="h-6 sm:h-8 bg-muted rounded w-12 sm:w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-xl sm:text-2xl font-bold">Real-time Metrics</h2>
        <Badge variant="outline" className="animate-pulse w-fit">
          <Activity className="h-3 w-3 mr-1" />
          Live
        </Badge>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-primary flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">
              {data?.systemHealth?.activeUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 15 minutes</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending Transactions</CardTitle>
            <DollarSign className="h-4 w-4 text-secondary flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-400">
              {data?.systemHealth?.pendingTransactions || 0}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">System Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-400">
              {data?.systemHealth?.systemErrors || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Health Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className={`text-lg sm:text-xl lg:text-2xl font-bold capitalize ${
              data?.systemHealth?.status === 'healthy' ? 'text-green-400' : 'text-red-400'
            }`}>
              {data?.systemHealth?.status || 'Unknown'}
            </div>
            <p className="text-xs text-muted-foreground">System status</p>
          </CardContent>
        </Card>
      </div>

      <Card className="hover-lift">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle>Platform Statistics</CardTitle>
          <CardDescription>Current platform metrics</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="text-center p-3 sm:p-4 border border-primary/10 rounded-lg bg-muted/20">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">{data?.platformStats?.totalUsers || 0}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Users</p>
            </div>
            <div className="text-center p-3 sm:p-4 border border-primary/10 rounded-lg bg-muted/20">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-secondary">{data?.platformStats?.activeListings || 0}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Active Listings</p>
            </div>
            <div className="text-center p-3 sm:p-4 border border-primary/10 rounded-lg bg-muted/20">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">{data?.platformStats?.completedTransactions || 0}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Completed Transactions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}