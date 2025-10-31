"use client"

import { createBrowserClient } from "@supabase/ssr"
import { useState } from "react"

export function LogoutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleLogout() {
    setLoading(true)
    try {
      // Sign out on client side only
      await supabase.auth.signOut()
      // Redirect to home
      window.location.href = "/"
    } catch (error) {
      console.error("Logout error:", error)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={className}
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  )
}
