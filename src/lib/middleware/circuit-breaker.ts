// Circuit breaker pattern implementation for production resilience

interface CircuitBreakerOptions {
  threshold: number
  timeout: number
  resetTimeout: number
}

export class CircuitBreaker {
  private failures = 0
  private lastFailure = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  
  constructor(private options: CircuitBreakerOptions) {}
  
  isOpen(): boolean {
    if (this.state === 'OPEN') {
      // Check if we should transition to half-open
      if (Date.now() - this.lastFailure > this.options.resetTimeout) {
        this.state = 'HALF_OPEN'
        return false
      }
      return true
    }
    return false
  }
  
  recordSuccess(): void {
    this.failures = 0
    this.state = 'CLOSED'
  }
  
  recordFailure(): void {
    this.failures++
    this.lastFailure = Date.now()
    
    if (this.failures >= this.options.threshold) {
      this.state = 'OPEN'
    }
  }
  
  getState(): string {
    return this.state
  }
  
  getFailureCount(): number {
    return this.failures
  }
}