"use client"

import { supabaseClient } from "@/lib/supabase-client"
import { useState } from "react"

export function LogoutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    try {
      // Sign out on client side only
      await supabaseClient.auth.signOut()
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
