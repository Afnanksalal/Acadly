import { prisma } from "@/lib/prisma"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChatMessages } from "./chat-messages"
import { ErrorBoundary } from "@/components/error-boundary"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { validateUUIDParam } from "@/lib/uuid-validation"

export default async function ChatDetailPage({ params }: { params: { id: string } }) {
  // Validate UUID format first
  const validation = validateUUIDParam(params.id, "chat")
  if (!validation.isValid) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg mb-4">{validation.error}</p>
            <Link href="/chats">
              <Button>Back to Messages</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/auth/login")
  
  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile?.verified) redirect("/dashboard")

  let chat
  try {
    chat = await prisma.chat.findUnique({
      where: { id: params.id },
      include: {
        listing: true,
        buyer: true,
        seller: true,
        messages: {
          orderBy: { createdAt: "asc" },
          include: { sender: true }
        }
      }
    })
  } catch (error) {
    console.error("Error fetching chat:", error)
    return (
      <main className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg mb-4">Error loading chat</p>
            <Link href="/chats">
              <Button>Back to Messages</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!chat) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg mb-4">Chat not found</p>
            <Link href="/chats">
              <Button>Back to Messages</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  // Check if user is participant
  if (chat.buyerId !== user.id && chat.sellerId !== user.id) {
    redirect("/chats")
  }

  const otherUser = chat.buyerId === user.id ? chat.seller : chat.buyer

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="mb-4">
        <Link href="/chats">
          <Button variant="outline">← Back to Messages</Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                👤
              </div>
              <div>
                <CardTitle>{otherUser.email?.split('@')[0]}</CardTitle>
                <Link href={`/listings/${chat.listing.id}`} className="text-sm text-muted-foreground hover:text-primary">
                  {chat.listing.title}
                </Link>
              </div>
            </div>
            <Link href={`/listings/${chat.listing.id}`}>
              <Button variant="outline" className="text-sm">View Listing</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ErrorBoundary>
            <ChatMessages 
              chatId={chat.id} 
              initialMessages={chat.messages.map(m => ({
                id: m.id,
                text: m.text,
                senderId: m.senderId,
                createdAt: m.createdAt.toISOString(),
                sender: {
                  email: m.sender?.email || null
                }
              }))} 
              currentUserId={user.id}
            />
          </ErrorBoundary>
        </CardContent>
      </Card>
    </main>
  )
}
