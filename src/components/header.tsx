import Link from "next/link"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import { LogoutButton } from "./logout-button"
import { MobileNav } from "./mobile-nav"
import { NotificationBell } from "@/components/notification-bell"
import { AnnouncementBanner } from "@/components/announcement-banner"
import { GraduationCap, Sparkles } from "lucide-react"

export async function Header() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const profile = user ? await prisma.profile.findUnique({ where: { id: user.id } }) : null
  
  return (
    <>
      <AnnouncementBanner />
      <header className="w-full border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5 hover:opacity-90 transition-all">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md group-hover:blur-lg transition-all" />
              <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-primary to-secondary">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold font-display tracking-tight">Acadly</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/listings" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all">
              Browse
            </Link>
            
            {user ? (
              <>
                <Link href="/orders" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all">
                  Orders
                </Link>
                <Link href="/chats" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all">
                  Messages
                </Link>
                <Link href="/listings/new" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Sell
                </Link>
                <Link href="/events" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all">
                  Events
                </Link>
                <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all">
                  Dashboard
                </Link>
                
                <div className="h-6 w-px bg-border/50 mx-2" />
                
                <div className="flex items-center gap-3">
                  <NotificationBell userId={user.id} />
                  <Link 
                    href="/profile" 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white">
                      {profile?.name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="hidden lg:flex flex-col items-start">
                      <span className="text-xs font-medium leading-tight">{profile?.name || profile?.email?.split('@')[0]}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">{profile?.role === 'ADMIN' ? 'Admin' : 'Student'}</span>
                    </div>
                  </Link>
                  <LogoutButton className="text-sm font-medium px-4 py-2 rounded-lg border border-border/50 hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive transition-all" />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link href="/auth/login" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Login
                </Link>
                <Link href="/auth/signup" className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/25 transition-all">
                  Get Started
                </Link>
              </div>
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
