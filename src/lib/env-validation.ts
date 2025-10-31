import { z } from "zod"

// Environment variable schema for validation
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("Invalid DATABASE_URL"),
  DIRECT_URL: z.string().url("Invalid DIRECT_URL").optional(),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  
  // Razorpay
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1, "NEXT_PUBLIC_RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, "RAZORPAY_WEBHOOK_SECRET is required"),
  
  // Optional but recommended
  UPSTASH_REDIS_REST_URL: z.string().url("Invalid UPSTASH_REDIS_REST_URL").optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().min(1, "CRON_SECRET is required for production"),
  
  // App configuration
  NEXT_PUBLIC_APP_URL: z.string().url("Invalid NEXT_PUBLIC_APP_URL"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Acadly"),
  ADMIN_EMAILS: z.string().optional(),
  
  // System
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
})

export type Env = z.infer<typeof envSchema>

let validatedEnv: Env | null = null

export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv
  }

  try {
    validatedEnv = envSchema.parse(process.env)
    return validatedEnv
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')
      
      console.error("❌ Environment validation failed:")
      console.error(missingVars)
      
      if (process.env.NODE_ENV === "production") {
        throw new Error(`Environment validation failed:\n${missingVars}`)
      } else {
        console.warn("⚠️  Some environment variables are missing. The app may not work correctly.")
      }
    }
    
    throw error
  }
}

export function getEnv(): Env {
  if (!validatedEnv) {
    return validateEnv()
  }
  return validatedEnv
}

// Validate environment on module load in production
if (process.env.NODE_ENV === "production") {
  validateEnv()
}

// Helper functions for common environment checks
export const isProduction = () => process.env.NODE_ENV === "production"
export const isDevelopment = () => process.env.NODE_ENV === "development"
export const isTest = () => process.env.NODE_ENV === "test"

export const hasRedis = () => {
  const env = getEnv()
  return !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
}

export const getAdminEmails = (): string[] => {
  const env = getEnv()
  return env.ADMIN_EMAILS ? env.ADMIN_EMAILS.split(',').map(email => email.trim()) : []
}

export const isAdmin = (email: string): boolean => {
  const adminEmails = getAdminEmails()
  return adminEmails.includes(email.toLowerCase())
}