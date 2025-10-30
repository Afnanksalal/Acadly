"use client"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { apiRequest, getErrorMessage } from "@/lib/api-client"

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
  const [shouldScroll, setShouldScroll] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    // Only scroll if we explicitly set shouldScroll (when user sends a message)
    if (shouldScroll) {
      scrollToBottom()
      setShouldScroll(false)
    }
  }, [messages, shouldScroll])

  // Real-time message updates using optimized polling
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    const fetchNewMessages = async () => {
      try {
        // Only fetch if we don't have the latest messages
        const lastMessageTime = messages.length > 0 
          ? new Date(messages[messages.length - 1].createdAt).getTime()
          : 0
        
        const res = await fetch(`/api/messages?chatId=${chatId}&after=${lastMessageTime}`, {
          cache: 'no-store'
        })
        
        if (res.ok) {
          const newMessages = await res.json()
          if (newMessages.length > 0) {
            setMessages(prev => [...prev, ...newMessages])
          }
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error)
      }
    }

    // Faster polling for better real-time feel, but only when tab is active
    if (typeof document !== 'undefined' && !document.hidden) {
      interval = setInterval(fetchNewMessages, 1000) // 1 second for real-time feel
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(interval)
      } else {
        fetchNewMessages() // Immediate fetch when tab becomes visible
        interval = setInterval(fetchNewMessages, 1000)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [chatId, messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    
    // Optimistically add the message immediately for instant feedback
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      text: newMessage.trim(),
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      sender: { email: "You" }
    }
    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage("")
    setShouldScroll(true)
    
    try {
      await apiRequest("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          chatId,
          text: newMessage.trim()
        })
      })
    } catch (error) {
      console.error("Failed to send message:", error)
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
      setNewMessage(newMessage.trim()) // Restore the message text
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[70vh] min-h-[500px] max-h-[700px]">
      {/* Messages - Scrollable area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4">
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
