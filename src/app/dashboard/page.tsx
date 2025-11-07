import { prisma } from "@/lib/prisma"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardStats } from "@/components/admin/dashboard-stats"
import { RealtimeMetrics } from "@/components/admin/realtime-metrics"
import { UserManagement } from "@/components/admin/user-management"
import { ContentModeration } from "@/components/admin/content-moderation"
import { FinancialOverview } from "@/components/admin/financial-overview"
import { SystemMonitor } from "@/components/admin/system-monitor"
import { AdminSettings } from "@/components/admin/admin-settings"
import { AuditLog } from "@/components/admin/audit-log"
import { ListingsManagement } from "@/components/admin/listings-management"
import { AnnouncementManagement } from "@/components/admin/announcement-management"
import { AnnouncementBanner } from "@/components/announcement-banner"

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Welcome to Acadly</h1>
          <p className="text-muted-foreground">Please sign in to continue.</p>
          <Link href="/auth/login" className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors inline-block">Login</Link>
        </div>
      </main>
    )
  }

  // Ensure profile exists
  let profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile) {
    profile = await prisma.profile.create({ data: { id: user.id, email: user.email ?? "" } })
  }

  // Elevate admin by allowlist if configured
  const adminList = (process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
  if (adminList.includes((profile.email ?? "").toLowerCase()) && profile.role !== "ADMIN") {
    profile = await prisma.profile.update({ where: { id: profile.id }, data: { role: "ADMIN" } })
  }

  const isAdmin = profile.role === "ADMIN"
  const gate = !profile.verified

  // Admin gets full dashboard with analytics and management
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        {/* Announcements */}
        <AnnouncementBanner />
        
        {/* Header */}
        <div className="bg-card border-b border-primary/10 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 lg:py-6 gap-3 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Platform management and analytics
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                  Admin Access
                </Badge>
                <div className="bg-primary/10 text-primary px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                  System Online
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-8">
          <Tabs defaultValue="overview" className="space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Mobile-friendly tabs with horizontal scroll */}
            <div className="w-full overflow-x-auto overflow-y-hidden pb-1 scrollbar-hide">
              <TabsList className="inline-flex h-8 sm:h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground min-w-max">
                <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                  Users
                </TabsTrigger>
                <TabsTrigger value="content" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                  Content
                </TabsTrigger>
                <TabsTrigger value="financial" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                  Financial
                </TabsTrigger>
                <TabsTrigger value="system" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                  System
                </TabsTrigger>
                <TabsTrigger value="audit" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                  Audit Log
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              <DashboardStats />
              <RealtimeMetrics />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
              <RealtimeMetrics />
              <FinancialOverview />
            </TabsContent>

            <TabsContent value="users" className="space-y-4 sm:space-y-6">
              <UserManagement />
            </TabsContent>

            <TabsContent value="content" className="space-y-4 sm:space-y-6">
              <ContentModeration />
              <ListingsManagement />
            </TabsContent>

            <TabsContent value="financial" className="space-y-4 sm:space-y-6">
              <FinancialOverview />
            </TabsContent>

            <TabsContent value="system" className="space-y-4 sm:space-y-6">
              <SystemMonitor />
              <AnnouncementManagement />
            </TabsContent>

            <TabsContent value="audit" className="space-y-4 sm:space-y-6">
              <AuditLog />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 sm:space-y-6">
              <AdminSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }

  // Regular user dashboard
  return (
    <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Announcements */}
      <AnnouncementBanner />
      
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">Welcome back!</h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">Manage your listings and account</p>
      </div>

      {gate ? (
        <Card className="border-secondary/20 bg-secondary/5 hover-lift">
          <CardContent className="pt-6 p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">⏳</div>
              <div className="flex-1 space-y-3">
                <h3 className="text-xl font-semibold text-foreground">Waiting for verification</h3>
                <p className="text-muted-foreground">
                  Your account is pending admin verification. You can browse listings, but buying/selling and messaging are disabled until verified.
                </p>
                <Link href="/listings">
                  <Button variant="outline">Browse Listings</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <Card className="md:col-span-2 hover-lift">
            <CardHeader>
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Link href="/listings/new" className="group">
                  <div className="rounded-xl border-2 border-primary/10 p-3 sm:p-4 lg:p-6 text-center transition-all hover:border-primary/30 hover:shadow-lg hover:scale-105 bg-muted/20">
                    <div className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3">📝</div>
                    <div className="font-medium group-hover:text-primary transition-colors text-foreground text-xs sm:text-sm lg:text-base">Create Listing</div>
                    <p className="text-xs text-muted-foreground mt-1 sm:mt-2 hidden sm:block">Sell your items</p>
                  </div>
                </Link>
                <Link href="/listings" className="group">
                  <div className="rounded-xl border-2 border-primary/10 p-3 sm:p-4 lg:p-6 text-center transition-all hover:border-primary/30 hover:shadow-lg hover:scale-105 bg-muted/20">
                    <div className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3">🛍️</div>
                    <div className="font-medium group-hover:text-primary transition-colors text-foreground text-xs sm:text-sm lg:text-base">Browse Listings</div>
                    <p className="text-xs text-muted-foreground mt-1 sm:mt-2 hidden sm:block">Find what you need</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-foreground">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="font-medium text-foreground">{profile.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">✓ Verified</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}
