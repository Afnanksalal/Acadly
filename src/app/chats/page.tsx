import { prisma } from "@/lib/prisma"
import { supabaseServer } from "@/lib/supabase-server"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { redirect } from "next/navigation"

export default async function ChatsPage() {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/auth/login")
  
  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile?.verified) redirect("/dashboard")

  // Get all chats where user is buyer or seller
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
      }
    },
    orderBy: { updatedAt: "desc" }
  })

  return (
    <main className="max-w-5xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Messages</CardTitle>
          <p className="text-sm text-muted-foreground">Your conversations</p>
        </CardHeader>
        <CardContent>
          {chats.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg font-medium mb-2">No messages yet</p>
              <p className="text-sm text-muted-foreground">Start a conversation by contacting a seller</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chats.map((chat) => {
                const otherUser = chat.buyerId === user.id ? chat.seller : chat.buyer
                const lastMessage = chat.messages[0]
                const unreadCount = chat.messages.filter(m => m.senderId !== user.id && m.readStatus !== "READ").length
                
                return (
                  <Link key={chat.id} href={`/chats/${chat.id}`}>
                    <div className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary hover:shadow-md transition-all">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl shrink-0">
                        👤
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <p className="font-medium">{otherUser.email?.split('@')[0]}</p>
                            <p className="text-xs text-muted-foreground">{chat.listing.title}</p>
                          </div>
                          {unreadCount > 0 && (
                            <Badge variant="default" className="shrink-0">{unreadCount}</Badge>
                          )}
                        </div>
                        {lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {lastMessage.senderId === user.id ? "You: " : ""}
                            {lastMessage.text}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">
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
