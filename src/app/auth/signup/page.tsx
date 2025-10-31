"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createBrowserClient } from "@supabase/ssr"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function onSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError("Email and password are required")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    setLoading(true)
    setError("")
    const { error: signUpError, data } = await supabase.auth.signUp({ email, password })
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
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background">
      <Card className="w-full max-w-md hover-lift">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-2xl text-foreground">Create your account</CardTitle>
          <p className="text-sm text-muted-foreground">Join the campus marketplace</p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {success ? (
            <Alert variant="success" className="space-y-2">
              <AlertTitle>Check your email!</AlertTitle>
              <AlertDescription>
                We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click the link to verify your account.
              </AlertDescription>
              <Button onClick={() => router.push("/auth/login")} className="w-full mt-4" variant="primary">Go to Login</Button>
            </Alert>
          ) : (
            <form onSubmit={onSignup} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  placeholder="you@college.edu"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Input
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <p className="text-xs text-muted-foreground">At least 6 characters</p>
              </div>
              <Button disabled={loading} className="w-full" variant="primary">
                {loading ? "Creating account..." : "Sign up"}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link className="text-primary hover:text-primary/80 underline transition-colors" href="/auth/login">
                  Login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
