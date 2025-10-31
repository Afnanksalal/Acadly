// Client-side API utilities for handling responses and errors

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Array<{
      field: string
      message: string
    }>
  }
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export class ApiError extends Error {
  public code: string
  public details?: Array<{ field: string; message: string }>

  constructor(message: string, code: string = 'API_ERROR', details?: Array<{ field: string; message: string }>) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryableStatuses: [408, 429, 500, 502, 503, 504]
}

// Exponential backoff with jitter
function calculateDelay(attempt: number): number {
  const delay = Math.min(
    RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
    RETRY_CONFIG.maxDelay
  )
  // Add jitter (±25%)
  const jitter = delay * 0.25 * (Math.random() * 2 - 1)
  return Math.round(delay + jitter)
}

export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      })

      clearTimeout(timeoutId)

      // Check if we should retry based on status
      if (!response.ok && RETRY_CONFIG.retryableStatuses.includes(response.status)) {
        if (attempt < RETRY_CONFIG.maxRetries) {
          const delay = calculateDelay(attempt)
          console.warn(`Request failed with ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
      }

      const data: ApiResponse<T> = await response.json()

      if (!response.ok || !data.success) {
        const error = data.error || { code: 'UNKNOWN_ERROR', message: 'An error occurred' }
        throw new ApiError(error.message, error.code, error.details)
      }

      return data.data as T
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      // Don't retry on certain errors
      if (error instanceof ApiError || 
          (error instanceof Error && error.name === 'AbortError')) {
        throw error
      }
      
      // Retry on network errors
      if (attempt < RETRY_CONFIG.maxRetries) {
        const delay = calculateDelay(attempt)
        console.warn(`Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries}):`, error)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
    }
  }
  
  // All retries exhausted
  if (lastError instanceof ApiError) {
    throw lastError
  }
  
  if (lastError instanceof Error) {
    throw new ApiError(lastError.message, 'NETWORK_ERROR')
  }
  
  throw new ApiError('Request failed after all retries', 'RETRY_EXHAUSTED')
}

// Helper function to extract user-friendly error message
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

// Helper function to get field-specific errors for forms
export function getFieldErrors(error: unknown): Record<string, string> {
  if (error instanceof ApiError && error.details) {
    return error.details.reduce((acc, detail) => {
      acc[detail.field] = detail.message
      return acc
    }, {} as Record<string, string>)
  }
  
  return {}
}