'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Server, Database, Cpu, HardDrive, Wifi } from 'lucide-react'

interface SystemData {
  health: {
    status: string
    score: number
  }
  performance: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    networkLatency: number
  }
  database: {
    activeConnections: number
    queryResponseTime: number
    databaseSize: string
  }
  api: {
    requestsPerMinute: number
    errorRate: number
    avgResponseTime: number
  }
}

export function SystemMonitor() {
  const [data, setData] = useState<SystemData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSystemData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchSystemData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchSystemData = async () => {
    try {
      const response = await fetch('/api/admin/system/monitor')
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      } else {
        // Handle API error
        console.error('Failed to fetch system monitor data')
      }
    } catch (error) {
      console.error('Failed to fetch system data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getUsageColor = (usage: number) => {
    if (usage >= 80) return 'text-red-400'
    if (usage >= 60) return 'text-yellow-400'
    return 'text-green-400'
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-xl sm:text-2xl font-bold">System Monitor</h2>
        <Badge variant="outline" className={`w-fit ${
          loading ? 'bg-muted/20 text-muted-foreground' :
          data?.health.status === 'healthy' ? 'bg-green-500/10 text-green-400 border-green-400/20' :
          'bg-red-500/10 text-red-400 border-red-400/20'
        }`}>
          {loading ? 'Loading...' : data?.health.status === 'healthy' ? 'All Systems Operational' : 'System Issues Detected'}
        </Badge>
      </div>
      
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className={`text-xl sm:text-2xl font-bold ${loading ? 'text-muted-foreground' : getUsageColor(data?.performance.cpuUsage || 0)}`}>
              {loading ? '...' : `${data?.performance.cpuUsage || 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">4 cores available</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className={`text-xl sm:text-2xl font-bold ${loading ? 'text-muted-foreground' : getUsageColor(data?.performance.memoryUsage || 0)}`}>
              {loading ? '...' : `${data?.performance.memoryUsage || 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading...' : `${((data?.performance.memoryUsage || 0) * 8 / 100).toFixed(1)}GB / 8GB used`}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className={`text-xl sm:text-2xl font-bold ${loading ? 'text-muted-foreground' : getUsageColor(data?.performance.diskUsage || 0)}`}>
              {loading ? '...' : `${data?.performance.diskUsage || 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading...' : `${((data?.performance.diskUsage || 0) * 500 / 100).toFixed(0)}GB / 500GB used`}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Network Latency</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className={`text-xl sm:text-2xl font-bold ${loading ? 'text-muted-foreground' : 
              (data?.performance.networkLatency || 0) < 150 ? 'text-green-400' : 
              (data?.performance.networkLatency || 0) < 300 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {loading ? '...' : `${data?.performance.networkLatency || 0}ms`}
            </div>
            <p className="text-xs text-muted-foreground">Average response time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="hover-lift">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Database Performance</CardTitle>
            <CardDescription>Database metrics and connection status</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between p-2 rounded bg-muted/20">
                <span className="text-sm">Active Connections</span>
                <Badge variant="outline">
                  {loading ? '...' : `${data?.database.activeConnections || 0}/100`}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/20">
                <span className="text-sm">Query Response Time</span>
                <Badge variant="outline">
                  {loading ? '...' : `${data?.database.queryResponseTime || 0}ms avg`}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/20">
                <span className="text-sm">Database Size</span>
                <Badge variant="outline">
                  {loading ? '...' : data?.database.databaseSize || 'N/A'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>API Performance</CardTitle>
            <CardDescription>API endpoint performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between p-2 rounded bg-muted/20">
                <span className="text-sm">Requests/min</span>
                <Badge variant="outline">
                  {loading ? '...' : (data?.api.requestsPerMinute || 0).toLocaleString()}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/20">
                <span className="text-sm">Error Rate</span>
                <Badge variant="outline" className={
                  loading ? '' :
                  (data?.api.errorRate || 0) < 1 ? 'bg-green-500/10 text-green-400 border-green-400/20' :
                  (data?.api.errorRate || 0) < 5 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-400/20' :
                  'bg-red-500/10 text-red-400 border-red-400/20'
                }>
                  {loading ? '...' : `${(data?.api.errorRate || 0).toFixed(1)}%`}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/20">
                <span className="text-sm">Avg Response Time</span>
                <Badge variant="outline">
                  {loading ? '...' : `${data?.api.avgResponseTime || 0}ms`}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}