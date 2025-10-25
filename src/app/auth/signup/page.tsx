"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabaseClient } from "@/lib/supabase-client"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

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
    const { error: signUpError, data } = await supabaseClient.auth.signUp({ email, password })
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
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <p className="text-sm opacity-70">Join the campus marketplace</p>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert variant="success" className="space-y-2">
              <AlertTitle>Check your email!</AlertTitle>
              <AlertDescription>
                We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click the link to verify your account.
              </AlertDescription>
              <Button onClick={() => router.push("/auth/login")} className="w-full mt-4">Go to Login</Button>
            </Alert>
          ) : (
            <form onSubmit={onSignup} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
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
                <label className="text-sm font-medium">Password</label>
                <Input
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <p className="text-xs opacity-60">At least 6 characters</p>
              </div>
              <Button disabled={loading} className="w-full">
                {loading ? "Creating account..." : "Sign up"}
              </Button>
              <div className="text-sm text-center opacity-80">
                Already have an account?{" "}
                <Link className="underline hover:opacity-100 transition-opacity" href="/auth/login">
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
