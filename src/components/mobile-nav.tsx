"use client"
import { useState } from "react"
import Link from "next/link"
import { LogoutButton } from "./logout-button"

export function MobileNav({ 
  user, 
  profile 
}: { 
  user: { id: string; email?: string } | null
  profile: { email: string | null; role: string } | null 
}) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-background/100 backdrop-blur-xl border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎓</span>
              <span className="font-bold">collegemart</span>
            </div>
            <button
              onClick={closeMenu}
              className="p-2 rounded-md hover:bg-muted transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              <Link
                href="/listings"
                onClick={closeMenu}
                className="block px-4 py-3 rounded-md hover:bg-muted transition-colors font-medium"
              >
                🛍️ Listings
              </Link>

              {user ? (
                <>
                  <Link
                    href="/orders"
                    onClick={closeMenu}
                    className="block px-4 py-3 rounded-md hover:bg-muted transition-colors font-medium"
                  >
                    📦 Orders
                  </Link>
                  <Link
                    href="/chats"
                    onClick={closeMenu}
                    className="block px-4 py-3 rounded-md hover:bg-muted transition-colors font-medium"
                  >
                    💬 Messages
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    className="block px-4 py-3 rounded-md hover:bg-muted transition-colors font-medium"
                  >
                    📊 Dashboard
                  </Link>
                  <Link
                    href="/listings/new"
                    onClick={closeMenu}
                    className="block px-4 py-3 rounded-md hover:bg-muted transition-colors font-medium"
                  >
                    ➕ Create Listing
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={closeMenu}
                    className="block px-4 py-3 rounded-md hover:bg-muted transition-colors font-medium"
                  >
                    🔑 Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={closeMenu}
                    className="block px-4 py-3 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors font-medium text-center"
                  >
                    ✨ Sign Up
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* User Info & Logout */}
          {user && profile && (
            <div className="p-4 border-t border-border space-y-3">
              <div className="px-4 py-2 bg-muted rounded-md">
                <p className="text-sm font-medium truncate">{profile.email?.split('@')[0]}</p>
                <p className="text-xs text-muted-foreground">
                  {profile.role === 'ADMIN' ? '👑 Admin' : '👤 User'}
                </p>
              </div>
              <LogoutButton className="w-full px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors" />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
