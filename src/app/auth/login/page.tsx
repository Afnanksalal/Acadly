"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createBrowserClient } from "@supabase/ssr"
import { GraduationCap, ArrowRight, Mail, Lock } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function onLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError("Email and password are required")
      return
    }
    setLoading(true)
    setError("")
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (loginError) {
      setError(loginError.message)
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
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to continue to your account</p>
        </div>

        {/* Card */}
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 sm:p-8 shadow-xl">
          <form onSubmit={onLogin} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="animate-fade-in">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
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
            
            <Input
              label="Password"
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
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
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link 
                className="text-primary hover:text-primary/80 font-medium transition-colors" 
                href="/auth/signup"
              >
                Create one free
              </Link>
            </p>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Secure login
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            256-bit encryption
          </span>
        </div>
      </div>
    </main>
  )
}
