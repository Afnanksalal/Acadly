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

export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const data: ApiResponse<T> = await response.json()

    if (!response.ok || !data.success) {
      const error = data.error || { code: 'UNKNOWN_ERROR', message: 'An error occurred' }
      throw new ApiError(error.message, error.code, error.details)
    }

    return data.data as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    
    // Handle network errors or JSON parsing errors
    if (error instanceof Error) {
      throw new ApiError(error.message, 'NETWORK_ERROR')
    }
    
    throw new ApiError('An unexpected error occurred', 'UNKNOWN_ERROR')
  }
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