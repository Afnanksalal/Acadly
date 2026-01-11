"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@supabase/ssr"
import { CheckCircle, Info, GraduationCap, ArrowRight, Mail, Lock, ShieldCheck } from "lucide-react"

// Kerala and major Indian college email patterns
const COLLEGE_DOMAIN_PATTERNS = [
  // Kerala specific
  /ktu\.edu\.in$/i,
  /cusat\.ac\.in$/i,
  /mgu\.ac\.in$/i,
  /uoc\.ac\.in$/i,
  /keralauniversity\.ac\.in$/i,
  /nitc\.ac\.in$/i,
  /iisertvm\.ac\.in$/i,
  /iitpkd\.ac\.in$/i,
  /iimk\.ac\.in$/i,
  // Generic Indian educational
  /\.edu\.in$/i,
  /\.ac\.in$/i,
  // IITs, NITs, IIITs
  /iit[a-z]*\.ac\.in$/i,
  /nit[a-z]*\.ac\.in$/i,
  /iiit[a-z]*\.ac\.in$/i,
  /bits-pilani\.ac\.in$/i,
]

function isCollegeEmail(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1]
  if (!domain) return false
  return COLLEGE_DOMAIN_PATTERNS.some(pattern => pattern.test(domain))
}

function getInstitutionHint(email: string): string | null {
  const domain = email.toLowerCase().split('@')[1]
  if (!domain) return null
  
  if (domain.includes('ktu')) return 'KTU'
  if (domain.includes('cusat')) return 'CUSAT'
  if (domain.includes('mgu')) return 'MG University'
  if (domain.includes('uoc')) return 'University of Calicut'
  if (domain.includes('keralauniversity')) return 'University of Kerala'
  if (domain.includes('nitc')) return 'NIT Calicut'
  if (domain.includes('iisertvm')) return 'IISER TVM'
  if (domain.includes('iitpkd')) return 'IIT Palakkad'
  if (domain.includes('iimk')) return 'IIM Kozhikode'
  if (domain.includes('iit')) return 'IIT'
  if (domain.includes('nit')) return 'NIT'
  if (domain.includes('iiit')) return 'IIIT'
  if (domain.includes('bits')) return 'BITS'
  if (domain.endsWith('.edu.in') || domain.endsWith('.ac.in')) return 'Verified Institution'
  
  return null
}

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const isCollege = isCollegeEmail(email)
  const institutionHint = getInstitutionHint(email)

  async function onSignup(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    
    if (!email || !password) {
      setError("Email and password are required")
      return
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    // Password strength check
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      setError("Password must contain uppercase, lowercase, and a number")
      return
    }
    
    setLoading(true)
    
    const { error: signUpError, data } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          // Pass college email status for auto-verification
          is_college_email: isCollege
        }
      }
    })
    
    setLoading(false)
    
    if (signUpError) {
      setError(signUpError.message)
    } else if (data.user && !data.session) {
      setSuccess(true)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
      
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-secondary">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold font-display tracking-tight">Acadly</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-muted-foreground">Join Kerala&apos;s student marketplace</p>
        </div>

        {/* Card */}
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 sm:p-8 shadow-xl">
          {success ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Check your email!</h2>
                <p className="text-muted-foreground text-sm">
                  We&apos;ve sent a confirmation link to <strong className="text-foreground">{email}</strong>
                </p>
              </div>
              {isCollege && (
                <Alert variant="success" className="text-left">
                  <ShieldCheck className="h-4 w-4" />
                  <AlertDescription>
                    Your college email will be <strong>auto-verified</strong> once you confirm!
                  </AlertDescription>
                </Alert>
              )}
              <Button onClick={() => router.push("/auth/login")} className="w-full" variant="primary" size="lg">
                Go to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={onSignup} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="animate-fade-in">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Input
                  label="Email"
                  placeholder="you@college.edu"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  leftIcon={<Mail className="h-4 w-4" />}
                />
                {email && (
                  <div className="flex items-center gap-2">
                    {isCollege ? (
                      <Badge variant="success" size="sm" icon={<CheckCircle className="h-3 w-3" />}>
                        {institutionHint ? `${institutionHint} - Auto-verified` : 'College email - Auto-verified'}
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm" icon={<Info className="h-3 w-3" />}>
                        Requires admin verification
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Input
                  label="Password"
                  placeholder="Create a strong password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  leftIcon={<Lock className="h-4 w-4" />}
                  helperText="Min 8 characters with uppercase, lowercase, and number"
                />
              </div>
              
              <Input
                label="Confirm Password"
                placeholder="Confirm your password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                leftIcon={<Lock className="h-4 w-4" />}
              />
              
              <Button 
                disabled={loading} 
                className="w-full" 
                variant="primary"
                size="lg"
                rightIcon={!loading && <ArrowRight className="h-4 w-4" />}
                loading={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                By signing up, you agree to our{" "}
                <Link href="/policies/terms" className="text-primary hover:underline">Terms</Link>
                {" "}and{" "}
                <Link href="/policies/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </p>
            </form>
          )}
          
          {!success && (
            <div className="mt-6 pt-6 border-t border-border/50 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link 
                  className="text-primary hover:text-primary/80 font-medium transition-colors" 
                  href="/auth/login"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Trust indicators */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Free forever
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            No credit card
          </span>
        </div>
      </div>
    </main>
  )
}
