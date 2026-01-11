import { prisma } from "@/lib/prisma"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { redirect } from "next/navigation"

export default async function ChatsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/auth/login")
  
  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile?.verified) redirect("/dashboard")

  // Get all chats where user is buyer or seller with optimized query
  const chats = await prisma.chat.findMany({
    where: {
      OR: [
        { buyerId: user.id },
        { sellerId: user.id }
      ]
    },
    include: {
      listing: true,
      buyer: true,
      seller: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      _count: {
        select: {
          messages: {
            where: {
              senderId: { not: user.id },
              readStatus: { not: "READ" }
            }
          }
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  })

  return (
    <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">Your conversations</p>
        </CardHeader>
        <CardContent>
          {chats.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg font-medium mb-2">No messages yet</p>
              <p className="text-sm text-muted-foreground">Start a conversation by contacting a seller</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              {chats.map((chat) => {
                const otherUser = chat.buyerId === user.id ? chat.seller : chat.buyer
                const lastMessage = chat.messages[0]
                // Use the optimized _count from the query instead of filtering in JS
                const unreadCount = (chat as any)._count?.messages || 0
                
                return (
                  <Link key={chat.id} href={`/chats/${chat.id}`}>
                    <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border hover:border-primary hover:shadow-md transition-all">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg sm:text-xl shrink-0">
                        👤
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base truncate">{otherUser.email?.split('@')[0]}</p>
                            <p className="text-xs text-muted-foreground truncate">{chat.listing.title}</p>
                          </div>
                          {unreadCount > 0 && (
                            <Badge variant="default" className="shrink-0 text-xs">{unreadCount}</Badge>
                          )}
                        </div>
                        {lastMessage && (
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {lastMessage.senderId === user.id ? "You: " : ""}
                            {lastMessage.text}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                        {new Date(chat.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
