'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  AlertTriangle,
  TrendingUp,
  Activity,
  MessageSquare,
  Star
} from 'lucide-react'

interface DashboardData {
  kpis: {
    revenue30d: {
      total: number
      transactions: number
      average: number
    }
    activeUsers24h: number
    newUsers7d: number
    activeListings: number
  }
  alerts: {
    total: number
    openDisputes: number
    pendingReports: number
    cancelledTransactions24h: number
    systemErrors24h: number
    severity: 'LOW' | 'MEDIUM' | 'HIGH'
  }
  trends: {
    userGrowth: Array<{ date: string; new_users: number }>
    revenueGrowth: Array<{ date: string; revenue: number; transactions: number }>
    listingActivity: Array<{ date: string; new_listings: number }>
  }
  topPerformers: {
    categories: Array<{ category: string; sales: number; revenue: number }>
    sellers: Array<{ id: string; name: string; email: string; sales: number; revenue: number }>
    activeUsers: Array<{ id: string; name: string; email: string; sessions: number; last_seen: Date }>
  }
  systemHealth: {
    score: number
    status: string
  }
  quickActions: Array<{
    title: string
    description: string
    url: string
    priority: string
  }>
}

export function DashboardStats() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    // Refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/summary')
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      } else {
        console.error('Failed to fetch dashboard data:', response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <div className="h-4 bg-muted rounded w-20 sm:w-24"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="h-6 sm:h-8 bg-muted rounded w-12 sm:w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-24 sm:w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'secondary'
      case 'LOW': return 'outline'
      default: return 'outline'
    }
  }

  const getHealthStatusColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Revenue (30d)</CardTitle>
            <DollarSign className="h-4 w-4 text-primary flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary truncate">{formatCurrency(data.kpis.revenue30d.total)}</div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {data.kpis.revenue30d.transactions} transactions • Avg: {formatCurrency(data.kpis.revenue30d.average)}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Users (24h)</CardTitle>
            <Users className="h-4 w-4 text-secondary flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-secondary">{data.kpis.activeUsers24h.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.kpis.newUsers7d} new users this week
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Listings</CardTitle>
            <ShoppingBag className="h-4 w-4 text-primary flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">{data.kpis.activeListings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Available for purchase
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className={`text-lg sm:text-xl lg:text-2xl font-bold ${getHealthStatusColor(data.systemHealth.score)}`}>
              {data.systemHealth.score}%
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Status: {data.systemHealth.status}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-yellow-400">{data.alerts.openDisputes}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <MessageSquare className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-red-400">{data.alerts.pendingReports}</div>
            <p className="text-xs text-muted-foreground">Need review</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Failed Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{data.alerts.cancelledTransactions24h}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Alert Status
              <Badge variant={getAlertSeverityColor(data.alerts.severity)}>
                {data.alerts.severity}
              </Badge>
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{data.alerts.total}</div>
            <p className="text-xs text-muted-foreground">Total active alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      {data.trends && (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {/* User Growth Chart */}
          <Card className="hover-lift">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg font-semibold">User Growth</CardTitle>
              <CardDescription>New user registrations over time</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data.trends.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(262 30% 25%)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: 'hsl(240 5% 65%)' }}
                    axisLine={{ stroke: 'hsl(262 30% 25%)' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'hsl(240 5% 65%)' }}
                    axisLine={{ stroke: 'hsl(262 30% 25%)' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(240 6% 8%)', 
                      border: '1px solid hsl(262 30% 25%)',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.2)',
                      color: 'hsl(0 0% 98%)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="new_users" 
                    stroke="hsl(262 83% 58%)" 
                    fill="hsl(262 83% 58%)" 
                    fillOpacity={0.2}
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card className="hover-lift">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
              <CardDescription>Daily revenue and transaction volume</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.trends.revenueGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(262 30% 25%)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: 'hsl(240 5% 65%)' }}
                    axisLine={{ stroke: 'hsl(262 30% 25%)' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'hsl(240 5% 65%)' }}
                    axisLine={{ stroke: 'hsl(262 30% 25%)' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(240 6% 8%)', 
                      border: '1px solid hsl(262 30% 25%)',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.2)',
                      color: 'hsl(0 0% 98%)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(142 76% 36%)" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(142 76% 36%)', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: 'hsl(142 76% 36%)', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Listing Activity Chart */}
          <Card className="hover-lift">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg font-semibold">Listing Activity</CardTitle>
              <CardDescription>New listings created daily</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.trends.listingActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(262 30% 25%)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: 'hsl(240 5% 65%)' }}
                    axisLine={{ stroke: 'hsl(262 30% 25%)' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'hsl(240 5% 65%)' }}
                    axisLine={{ stroke: 'hsl(262 30% 25%)' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(240 6% 8%)', 
                      border: '1px solid hsl(262 30% 25%)',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.2)',
                      color: 'hsl(0 0% 98%)'
                    }}
                  />
                  <Bar 
                    dataKey="new_listings" 
                    fill="hsl(258 90% 66%)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Performers */}
      {data.topPerformers && (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Top Categories */}
          <Card className="hover-lift">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg font-semibold">Top Categories</CardTitle>
              <CardDescription>Best performing product categories</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3">
                {data.topPerformers.categories.slice(0, 5).map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{category.category}</p>
                      <p className="text-xs text-muted-foreground">{category.sales} sales</p>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className="font-semibold text-sm text-primary">{formatCurrency(category.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Sellers */}
          <Card className="hover-lift">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg font-semibold">Top Sellers</CardTitle>
              <CardDescription>Highest revenue generating users</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3">
                {data.topPerformers.sellers.slice(0, 5).map((seller, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{seller.name}</p>
                      <p className="text-xs text-muted-foreground">{seller.sales} sales</p>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className="font-semibold text-sm text-primary">{formatCurrency(seller.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Most Active Users */}
          <Card className="hover-lift">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg font-semibold">Most Active Users</CardTitle>
              <CardDescription>Users with highest session activity</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3">
                {data.topPerformers.activeUsers.slice(0, 5).map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.sessions} sessions</p>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {new Date(user.last_seen).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="hover-lift">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {data.quickActions.map((action, index) => (
              <div
                key={index}
                className="p-3 sm:p-4 border border-primary/10 rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20"
                onClick={() => window.location.href = action.url}
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <h4 className="font-medium text-sm flex-1 min-w-0">{action.title}</h4>
                  <Badge 
                    variant={action.priority === 'HIGH' ? 'destructive' : 'outline'}
                    className="text-xs flex-shrink-0"
                  >
                    {action.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{action.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}