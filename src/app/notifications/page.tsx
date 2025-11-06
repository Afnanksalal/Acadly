import { prisma } from "@/lib/prisma"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Bell, 
  CreditCard, 
  AlertTriangle, 
  Star, 
  MessageCircle, 
  Shield, 
  Settings, 
  Megaphone, 
  Lock,
  Calendar,
  Award
} from "lucide-react"

export default async function NotificationsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/auth/login")

  // Get all notifications for the user
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" }
    ],
    take: 100 // Limit to last 100 notifications
  })

  // Mark all as read when viewing this page
  await prisma.notification.updateMany({
    where: { 
      userId: user.id,
      isRead: false 
    },
    data: { isRead: true }
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-destructive'
      case 'HIGH': return 'bg-orange-500'
      case 'NORMAL': return 'bg-primary'
      case 'LOW': return 'bg-muted-foreground'
      default: return 'bg-primary'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TRANSACTION': return <CreditCard className="h-5 w-5 text-green-400" />
      case 'DISPUTE': return <AlertTriangle className="h-5 w-5 text-yellow-400" />
      case 'REVIEW': return <Star className="h-5 w-5 text-yellow-400" />
      case 'CHAT': return <MessageCircle className="h-5 w-5 text-primary" />
      case 'ADMIN': return <Shield className="h-5 w-5 text-destructive" />
      case 'SYSTEM': return <Settings className="h-5 w-5 text-muted-foreground" />
      case 'MARKETING': return <Megaphone className="h-5 w-5 text-orange-400" />
      case 'SECURITY': return <Lock className="h-5 w-5 text-destructive" />
      default: return <Bell className="h-5 w-5 text-primary" />
    }
  }

  const getActionUrl = (notification: any) => {
    try {
      const data = notification.data ? JSON.parse(notification.data) : null
      return data?.actionUrl || null
    } catch {
      return null
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Stay updated with your account activity
          </p>
        </div>
        <Badge variant="secondary" className="text-xs sm:text-sm">
          {notifications.length} total
        </Badge>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
            <p className="text-muted-foreground mb-6">
              You&apos;ll see notifications here when there&apos;s activity on your account
            </p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const actionUrl = getActionUrl(notification)
            
            const NotificationCard = (
              <Card 
                key={notification.id}
                className={`transition-all hover:shadow-md ${
                  !notification.isRead ? 'bg-primary/5 border-primary/20' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-sm sm:text-base line-clamp-1">
                          {notification.title}
                        </h3>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                        {!notification.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {notification.type}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              notification.priority === 'URGENT' ? 'border-destructive text-destructive' :
                              notification.priority === 'HIGH' ? 'border-orange-500 text-orange-500' :
                              ''
                            }`}
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                        {actionUrl && (
                          <Button variant="outline" size="sm" className="text-xs">
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )

            return actionUrl ? (
              <Link key={notification.id} href={actionUrl}>
                {NotificationCard}
              </Link>
            ) : NotificationCard
          })}
        </div>
      )}

      {notifications.length > 0 && (
        <div className="text-center pt-6">
          <p className="text-sm text-muted-foreground">
            Showing {notifications.length} most recent notifications
          </p>
        </div>
      )}
    </main>
  )
}