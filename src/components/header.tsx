import Link from "next/link"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import { LogoutButton } from "./logout-button"
import { MobileNav } from "./mobile-nav"
import { NotificationBell } from "@/components/notification-bell"
import { AnnouncementBanner } from "@/components/announcement-banner"
import { GraduationCap } from "lucide-react"

export async function Header() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const profile = user ? await prisma.profile.findUnique({ where: { id: user.id } }) : null
  
  return (
    <>
      <AnnouncementBanner />
      <header className="w-full border-b border-border backdrop-blur-sm bg-background/95 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Acadly</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/listings" className="text-sm font-medium hover:text-primary transition-colors">
            Browse
          </Link>
          
          {user ? (
            <>
              <Link href="/orders" className="text-sm font-medium hover:text-primary transition-colors">
                Orders
              </Link>
              <Link href="/chats" className="text-sm font-medium hover:text-primary transition-colors">
                Messages
              </Link>
              <Link href="/listings/new" className="text-sm font-medium hover:text-primary transition-colors">
                Sell
              </Link>
              <Link href="/events" className="text-sm font-medium hover:text-primary transition-colors">
                Events
              </Link>
              <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Link href="/profile" className="text-sm font-medium hover:text-primary transition-colors">
                Profile
              </Link>
              <Link href="/reviews" className="text-sm font-medium hover:text-primary transition-colors">
                Reviews
              </Link>
              <Link href="/disputes" className="text-sm font-medium hover:text-primary transition-colors">
                Disputes
              </Link>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-3">
                <NotificationBell userId={user.id} />
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-xs font-medium">{profile?.email?.split('@')[0]}</span>
                  <span className="text-xs text-muted-foreground">{profile?.role === 'ADMIN' ? 'Admin' : 'User'}</span>
                </div>
                <LogoutButton className="text-sm font-medium px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors" />
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm font-medium hover:text-primary transition-colors">
                Login
              </Link>
              <Link href="/auth/signup" className="text-sm font-medium px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                Sign Up
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Navigation & Notification */}
        <div className="md:hidden flex items-center gap-2">
          {user && <NotificationBell userId={user.id} />}
          <MobileNav user={user} profile={profile} />
        </div>
        </div>
      </header>
    </>
  )
}
