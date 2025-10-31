'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { DollarSign, TrendingUp, CreditCard, RefreshCw } from 'lucide-react'

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

interface FinancialData {
  revenue: {
    total: number
    transactions: number
    averageTransaction: number
    growthRate: number
    dailyBreakdown: Array<{
      date: string
      revenue: number
      transactions: number
    }>
  }
  fees: {
    platformCommission: Array<{
      platform_commission: number
      seller_earnings: number
      transactions: number
    }>
  }
  refunds: {
    total: number
    count: number
  }
  health: {
    successRate: number
    disputeRate: number
    cancelledTransactions: number
    pendingRevenue: number
  }
}

export function FinancialOverview() {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    fetchFinancialData()
  }, [period]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchFinancialData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/financial/overview?period=${period}`)
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      } else {
        console.error('Failed to fetch financial data:', response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch financial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold">Financial Overview</h2>
        </div>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="p-4 sm:p-6">
                <div className="h-4 bg-muted rounded w-32"></div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="h-8 bg-muted rounded w-24 mb-2"></div>
                <div className="h-3 bg-muted rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load financial data</p>
      </div>
    )
  }

  const platformCommission = data.fees.platformCommission[0]?.platform_commission || 0
  const sellerEarnings = data.fees.platformCommission[0]?.seller_earnings || 0

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Financial Overview</h2>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                period === p 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-primary">{formatCurrency(data.revenue.total)}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(data.revenue.growthRate)} from last period
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-secondary">{formatCurrency(platformCommission)}</div>
            <p className="text-xs text-muted-foreground">5% platform fee</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Successful Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-400">{data.revenue.transactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{data.health.successRate.toFixed(1)}% success rate</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Refunds Issued</CardTitle>
            <RefreshCw className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-yellow-400">{data.refunds.count}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(data.refunds.total)} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="hover-lift">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>Daily revenue and transaction volume over time</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data.revenue.dailyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: any, name: string) => [
                  name === 'revenue' ? formatCurrency(value) : value,
                  name === 'revenue' ? 'Revenue' : 'Transactions'
                ]}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.1}
                strokeWidth={3}
              />
              <Area 
                type="monotone" 
                dataKey="transactions" 
                stroke="#8b5cf6" 
                fill="#8b5cf6" 
                fillOpacity={0.1}
                strokeWidth={2}
                yAxisId="right"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Financial Health Metrics */}
        <Card className="hover-lift">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Financial Health</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-4">
              {/* Success Rate Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span className="text-sm font-bold text-green-600">{data.health.successRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${data.health.successRate}%` }}
                  ></div>
                </div>
              </div>

              {/* Dispute Rate Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Dispute Rate</span>
                  <span className="text-sm font-bold text-yellow-600">{data.health.disputeRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(data.health.disputeRate, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-bold text-primary">{formatCurrency(data.health.pendingRevenue)}</div>
                  <div className="text-xs text-muted-foreground">Pending Revenue</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-bold text-secondary">{formatCurrency(data.revenue.averageTransaction)}</div>
                  <div className="text-xs text-muted-foreground">Avg Transaction</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card className="hover-lift">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Platform commission vs seller earnings</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-4">
              {/* Commission Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-violet-50 rounded-lg border border-violet-200">
                  <div>
                    <div className="font-medium text-violet-900">Platform Commission</div>
                    <div className="text-sm text-violet-600">5% of total revenue</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-violet-900">{formatCurrency(platformCommission)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <div className="font-medium text-green-900">Seller Earnings</div>
                    <div className="text-sm text-green-600">95% of total revenue</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-900">{formatCurrency(sellerEarnings)}</div>
                  </div>
                </div>
              </div>

              {/* Visual Breakdown */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Revenue Distribution</span>
                </div>
                <div className="flex rounded-lg overflow-hidden h-3">
                  <div 
                    className="bg-violet-500" 
                    style={{ width: '5%' }}
                    title={`Platform: ${formatCurrency(platformCommission)}`}
                  ></div>
                  <div 
                    className="bg-green-500" 
                    style={{ width: '95%' }}
                    title={`Sellers: ${formatCurrency(sellerEarnings)}`}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Platform (5%)</span>
                  <span>Sellers (95%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}