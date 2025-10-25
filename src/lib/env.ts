// Environment variables validation and type safety

function getEnvVar(key: string, required: boolean = true): string {
  const value = process.env[key]
  
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  
  return value || ''
}

// Server-side only environment variables
export const serverEnv = {
  // Database
  DATABASE_URL: getEnvVar('DATABASE_URL'),
  
  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  
  // Razorpay
  RAZORPAY_KEY_ID: getEnvVar('RAZORPAY_KEY_ID'),
  RAZORPAY_KEY_SECRET: getEnvVar('RAZORPAY_KEY_SECRET'),
  RAZORPAY_WEBHOOK_SECRET: getEnvVar('RAZORPAY_WEBHOOK_SECRET'),
  
  // Admin
  ADMIN_EMAILS: getEnvVar('ADMIN_EMAILS', false),
}

// Client-side safe environment variables
export const clientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: getEnvVar('NEXT_PUBLIC_RAZORPAY_KEY_ID'),
}

// Validate all environment variables on startup
export function validateEnv() {
  try {
    // Validate server env
    Object.entries(serverEnv).forEach(([key, value]) => {
      if (!value && key !== 'ADMIN_EMAILS') {
        console.warn(`Warning: ${key} is not set`)
      }
    })
    
    // Validate client env
    Object.entries(clientEnv).forEach(([key, value]) => {
      if (!value) {
        console.warn(`Warning: ${key} is not set`)
      }
    })
    
    console.log('✓ Environment variables validated')
    return true
  } catch (error) {
    console.error('Environment validation failed:', error)
    return false
  }
}

// Security helpers
export function sanitizeForLog(data: unknown): unknown {
  const sensitive = ['password', 'secret', 'key', 'token', 'api']
  
  if (typeof data === 'string') {
    return data.length > 100 ? data.substring(0, 100) + '...' : data
  }
  
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map(item => sanitizeForLog(item))
    }
    
    const sanitized: Record<string, unknown> = {}
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase()
      const isSensitive = sensitive.some(s => lowerKey.includes(s))
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeForLog(value)
      } else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  }
  
  return data
}

// Rate limiting helper (simple in-memory)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs })
    return true
  }
  
  if (record.count >= maxRequests) {
    return false
  }
  
  record.count++
  return true
}

// Clean up old rate limit records periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetAt) {
        rateLimitMap.delete(key)
      }
    }
  }, 60000) // Clean up every minute
}
