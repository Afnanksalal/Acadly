// Production monitoring and analytics system

interface MetricData {
  timestamp: number
  value: number
  tags?: Record<string, string>
}

interface PerformanceMetric {
  name: string
  duration: number
  success: boolean
  timestamp: number
  metadata?: Record<string, any>
}

class ProductionMonitor {
  private metrics: Map<string, MetricData[]> = new Map()
  private performanceMetrics: PerformanceMetric[] = []
  private readonly maxMetricsPerType = 1000
  private readonly maxPerformanceMetrics = 500

  // Track API response times
  trackApiPerformance(endpoint: string, duration: number, success: boolean, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name: `api.${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`,
      duration,
      success,
      timestamp: Date.now(),
      metadata
    }

    this.performanceMetrics.push(metric)
    
    // Keep only recent metrics
    if (this.performanceMetrics.length > this.maxPerformanceMetrics) {
      this.performanceMetrics.splice(0, this.performanceMetrics.length - this.maxPerformanceMetrics)
    }

    // Log slow requests
    if (duration > 5000) { // 5 seconds
      console.warn(`Slow API request detected: ${endpoint} took ${duration}ms`, metadata)
    }
  }

  // Track business metrics
  trackMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: MetricData = {
      timestamp: Date.now(),
      value,
      tags
    }

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const metrics = this.metrics.get(name)!
    metrics.push(metric)

    // Keep only recent metrics
    if (metrics.length > this.maxMetricsPerType) {
      metrics.splice(0, metrics.length - this.maxMetricsPerType)
    }
  }

  // Get performance summary
  getPerformanceSummary(timeWindow: number = 3600000): any { // Default 1 hour
    const cutoff = Date.now() - timeWindow
    const recentMetrics = this.performanceMetrics.filter(m => m.timestamp > cutoff)

    if (recentMetrics.length === 0) {
      return { totalRequests: 0, averageResponseTime: 0, successRate: 0 }
    }

    const totalRequests = recentMetrics.length
    const successfulRequests = recentMetrics.filter(m => m.success).length
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests
    const successRate = (successfulRequests / totalRequests) * 100

    // Group by endpoint
    const byEndpoint = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = { count: 0, totalDuration: 0, successes: 0 }
      }
      acc[metric.name].count++
      acc[metric.name].totalDuration += metric.duration
      if (metric.success) acc[metric.name].successes++
      return acc
    }, {} as Record<string, any>)

    const endpointStats = Object.entries(byEndpoint).map(([name, stats]: [string, any]) => ({
      endpoint: name,
      requests: stats.count,
      averageResponseTime: Math.round(stats.totalDuration / stats.count),
      successRate: Math.round((stats.successes / stats.count) * 100)
    }))

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      successRate: Math.round(successRate * 100) / 100,
      endpointStats: endpointStats.sort((a, b) => b.requests - a.requests)
    }
  }

  // Get business metrics summary
  getMetricsSummary(): Record<string, any> {
    const summary: Record<string, any> = {}
    
    for (const [name, metrics] of this.metrics.entries()) {
      const recentMetrics = metrics.filter(m => m.timestamp > Date.now() - 3600000) // Last hour
      
      if (recentMetrics.length > 0) {
        const values = recentMetrics.map(m => m.value)
        summary[name] = {
          count: recentMetrics.length,
          sum: values.reduce((a, b) => a + b, 0),
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          latest: values[values.length - 1]
        }
      }
    }
    
    return summary
  }

  // Clear old metrics
  cleanup() {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000 // 24 hours
    
    // Clean performance metrics
    this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp > cutoff)
    
    // Clean business metrics
    for (const [name, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(m => m.timestamp > cutoff)
      if (filtered.length === 0) {
        this.metrics.delete(name)
      } else {
        this.metrics.set(name, filtered)
      }
    }
  }
}

// Global monitor instance
export const monitor = new ProductionMonitor()

// Cleanup old metrics every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => monitor.cleanup(), 3600000)
}

// Performance tracking decorator
export function trackPerformance(endpoint: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      let success = false
      let error: any = null
      
      try {
        const result = await method.apply(this, args)
        success = true
        return result
      } catch (err) {
        error = err
        throw err
      } finally {
        const duration = Date.now() - startTime
        monitor.trackApiPerformance(endpoint, duration, success, { error: error?.message })
      }
    }
    
    return descriptor
  }
}

// Business metrics helpers
export const metrics = {
  // User actions
  userRegistered: () => monitor.trackMetric('users.registered', 1),
  userVerified: () => monitor.trackMetric('users.verified', 1),
  userLogin: () => monitor.trackMetric('users.login', 1),
  
  // Listings
  listingCreated: (category: string) => monitor.trackMetric('listings.created', 1, { category }),
  listingViewed: () => monitor.trackMetric('listings.viewed', 1),
  
  // Transactions
  transactionCreated: (amount: number) => monitor.trackMetric('transactions.created', 1, { amount: amount.toString() }),
  transactionCompleted: (amount: number) => monitor.trackMetric('transactions.completed', amount),
  transactionFailed: () => monitor.trackMetric('transactions.failed', 1),
  
  // Messages
  messageSent: () => monitor.trackMetric('messages.sent', 1),
  
  // Errors
  errorOccurred: (type: string) => monitor.trackMetric('errors.occurred', 1, { type }),
  
  // Performance
  slowQuery: (duration: number, query: string) => monitor.trackMetric('database.slow_queries', duration, { query }),
}