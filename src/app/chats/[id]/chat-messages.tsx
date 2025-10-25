"use client"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type Message = {
  id: string
  text: string
  senderId: string
  createdAt: string
  sender: { email: string | null }
}

export function ChatMessages({ 
  chatId, 
  initialMessages, 
  currentUserId 
}: { 
  chatId: string
  initialMessages: Message[]
  currentUserId: string
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Poll for new messages every 3 seconds (network efficient)
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    const pollMessages = async () => {
      try {
        const res = await fetch(`/api/messages?chatId=${chatId}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })
        if (res.ok) {
          const data = await res.json()
          if (data.length > messages.length) {
            setMessages(data)
          }
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error)
      }
    }

    // Poll every 3 seconds when tab is visible
    if (typeof document !== 'undefined' && !document.hidden) {
      interval = setInterval(pollMessages, 3000)
    }

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(interval)
      } else {
        pollMessages() // Immediate fetch when tab becomes visible
        interval = setInterval(pollMessages, 3000)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [chatId, messages.length])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          senderId: currentUserId,
          content: newMessage.trim()
        })
      })

      if (res.ok) {
        const data = await res.json()
        setMessages([...messages, {
          ...data,
          createdAt: new Date().toISOString(),
          sender: { email: "You" }
        }])
        setNewMessage("")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === currentUserId
            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-lg p-3 ${
                  isOwn 
                    ? "bg-primary text-white" 
                    : "bg-muted"
                }`}>
                  <p className="text-sm break-words">{msg.text}</p>
                  <p className={`text-xs mt-1 ${isOwn ? "text-white/70" : "text-muted-foreground"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            {sending ? "Sending..." : "Send"}
          </Button>
        </form>
      </div>
    </div>
  )
}
