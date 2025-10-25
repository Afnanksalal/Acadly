"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogoutButton } from "./logout-button"

type Route = "/" | "/listings" | "/dashboard" | "/orders" | "/chats" | "/profile" | "/reviews" | "/events" | "/listings/new" | "/auth/login" | "/auth/signup"

export function MobileNav({ 
  user, 
  profile 
}: { 
  user: { id: string; email?: string } | null
  profile: { email: string | null; role: string } | null 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open and ensure no horizontal scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    // Always prevent horizontal scroll
    document.documentElement.style.overflowX = 'hidden'
    document.body.style.overflowX = 'hidden'
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  const isActive = (path: string) => pathname === path

  return (
    <>
      {/* Hamburger Button - Only visible on mobile */}
      <button
        onClick={toggleMenu}
        className="md:hidden relative z-50 p-2 rounded-lg hover:bg-muted/80 active:bg-muted transition-colors touch-manipulation"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <div className="w-6 h-5 flex flex-col justify-between">
          <span
            className={`block h-0.5 w-full bg-current transform transition-all duration-300 ease-in-out ${
              isOpen ? 'rotate-45 translate-y-2' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-full bg-current transition-all duration-300 ease-in-out ${
              isOpen ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`block h-0.5 w-full bg-current transform transition-all duration-300 ease-in-out ${
              isOpen ? '-rotate-45 -translate-y-2' : ''
            }`}
          />
        </div>
      </button>

      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Mobile Sidebar - Hidden by default, slides in from right */}
      <div
        className={`fixed top-0 right-0 h-screen w-[280px] max-w-[85vw] bg-background border-l border-border shadow-2xl z-50 md:hidden transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <Link href="/" onClick={closeMenu} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-2xl">🎓</span>
              <span className="font-bold text-lg">collegemart</span>
            </Link>
            <button
              onClick={closeMenu}
              className="p-2 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors touch-manipulation"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info - Show at top if logged in */}
          {user && profile && (
            <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                  {profile.role === 'ADMIN' ? '👑' : '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{profile.email?.split('@')[0]}</p>
                  <p className="text-xs text-muted-foreground">
                    {profile.role === 'ADMIN' ? 'Administrator' : 'Member'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto overscroll-contain p-3 pb-6">
            <div className="space-y-1">
              {/* Public Links */}
              <NavLink href="/" onClick={closeMenu} isActive={isActive('/')} icon="🏠">
                Home
              </NavLink>
              
              <NavLink href="/listings" onClick={closeMenu} isActive={isActive('/listings')} icon="🛍️">
                Browse Listings
              </NavLink>
              
              <NavLink href="/events" onClick={closeMenu} isActive={isActive('/events')} icon="📅">
                Events
              </NavLink>

              {user ? (
                <>
                  {/* Divider */}
                  <div className="my-3 border-t border-border" />
                  <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    My Account
                  </p>

                  <NavLink href="/dashboard" onClick={closeMenu} isActive={isActive('/dashboard')} icon="📊">
                    Dashboard
                  </NavLink>
                  
                  <NavLink href="/orders" onClick={closeMenu} isActive={isActive('/orders')} icon="📦">
                    My Orders
                  </NavLink>
                  
                  <NavLink href="/chats" onClick={closeMenu} isActive={isActive('/chats')} icon="💬">
                    Messages
                  </NavLink>
                  
                  <NavLink href="/profile" onClick={closeMenu} isActive={isActive('/profile')} icon="👤">
                    Profile
                  </NavLink>
                  
                  <NavLink href="/reviews" onClick={closeMenu} isActive={isActive('/reviews')} icon="⭐">
                    Reviews
                  </NavLink>

                  {/* Divider */}
                  <div className="my-3 border-t border-border" />

                  {/* Create Listing - Highlighted */}
                  <Link
                    href="/listings/new"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transition-all font-medium shadow-sm touch-manipulation"
                  >
                    <span className="text-lg">➕</span>
                    <span>Create Listing</span>
                  </Link>
                </>
              ) : (
                <>
                  {/* Divider */}
                  <div className="my-3 border-t border-border" />
                  <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Get Started
                  </p>

                  {/* Auth Links */}
                  <Link
                    href="/auth/login"
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg border-2 border-border hover:bg-muted active:bg-muted/80 transition-all font-medium touch-manipulation"
                  >
                    <span className="text-lg">🔑</span>
                    <span>Login</span>
                  </Link>
                  
                  <Link
                    href="/auth/signup"
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transition-all font-medium shadow-sm touch-manipulation"
                  >
                    <span className="text-lg">✨</span>
                    <span>Sign Up</span>
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Logout Button - Fixed at bottom */}
          {user && (
            <div className="p-4 border-t border-border bg-muted/30">
              <LogoutButton className="w-full px-4 py-3 text-sm font-medium rounded-lg border border-border hover:bg-muted active:bg-muted/80 transition-all touch-manipulation" />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Reusable NavLink Component
function NavLink({ 
  href, 
  onClick, 
  isActive, 
  icon, 
  children 
}: { 
  href: Route
  onClick: () => void
  isActive: boolean
  icon: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all touch-manipulation ${
        isActive
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'hover:bg-muted active:bg-muted/80'
      }`}
    >
      <span className="text-lg flex-shrink-0">{icon}</span>
      <span className="flex-1">{children}</span>
      {isActive && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
      )}
    </Link>
  )
}
