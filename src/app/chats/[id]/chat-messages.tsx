"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { apiRequest } from "@/lib/api-client"

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
  const [isClient, setIsClient] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<number>(Date.now())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Reset messages when chatId changes (navigation between chats)
  useEffect(() => {
    setMessages(initialMessages)
    setLastFetchTime(Date.now())
  }, [chatId, initialMessages])

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages.length, scrollToBottom])

  // Deduplicate messages by ID
  const deduplicateMessages = useCallback((newMessages: Message[], existingMessages: Message[]) => {
    const existingIds = new Set(existingMessages.map(m => m.id))
    return newMessages.filter(msg => !existingIds.has(msg.id))
  }, [])

  // Fetch new messages function
  const fetchNewMessages = useCallback(async () => {
    if (!isClient) return

    try {
      const res = await fetch(`/api/messages?chatId=${chatId}&after=${lastFetchTime}`, {
        cache: 'no-store'
      })
      
      if (res.ok) {
        const response = await res.json()
        const newMessages = response.success ? response.data : response
        
        if (Array.isArray(newMessages) && newMessages.length > 0) {
          setMessages(prev => {
            const uniqueNewMessages = deduplicateMessages(newMessages, prev)
            if (uniqueNewMessages.length > 0) {
              setLastFetchTime(Date.now())
              return [...prev, ...uniqueNewMessages]
            }
            return prev
          })
        }
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }, [chatId, lastFetchTime, isClient, deduplicateMessages])

  // Enhanced real-time polling with adaptive intervals and connection management
  useEffect(() => {
    if (!isClient) return

    let consecutiveFailures = 0
    const maxFailures = 3
    let currentInterval = 3000 // Start with 3 seconds
    
    const adaptiveInterval = () => {
      // Increase interval on failures, decrease on success
      if (consecutiveFailures > 0) {
        return Math.min(currentInterval * Math.pow(2, consecutiveFailures), 30000) // Max 30 seconds
      }
      return 3000 // Normal interval
    }

    const startPolling = () => {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      // Adaptive polling with failure handling
      const poll = async () => {
        try {
          await fetchNewMessages()
          consecutiveFailures = 0 // Reset on success
          currentInterval = 3000
        } catch (error) {
          consecutiveFailures++
          console.warn(`Chat polling failed (${consecutiveFailures}/${maxFailures}):`, error)
          
          if (consecutiveFailures >= maxFailures) {
            console.error("Chat polling disabled due to repeated failures")
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            return
          }
        }
      }
      
      // Start polling with adaptive interval
      intervalRef.current = setInterval(poll, adaptiveInterval())
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else {
        // Reset failure count when tab becomes visible
        consecutiveFailures = 0
        fetchNewMessages() // Immediate fetch when tab becomes visible
        startPolling()
      }
    }

    const handleOnline = () => {
      console.log("Connection restored, resuming chat polling")
      consecutiveFailures = 0
      if (!document.hidden) {
        startPolling()
      }
    }

    const handleOffline = () => {
      console.log("Connection lost, pausing chat polling")
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    // Start polling after component is ready
    const timeoutId = setTimeout(() => {
      if (!document.hidden && navigator.onLine) {
        startPolling()
      }
    }, 2000) // Longer delay for stability

    // Event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearTimeout(timeoutId)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isClient, fetchNewMessages])

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    const messageText = newMessage.trim()
    setSending(true)
    setNewMessage("") // Clear input immediately
    
    try {
      const response = await apiRequest("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          chatId,
          text: messageText
        })
      })

      // Add the real message to state immediately
      if (response) {
        const realMessage: Message = {
          id: response.id || `msg-${Date.now()}`,
          text: messageText,
          senderId: currentUserId,
          createdAt: new Date().toISOString(),
          sender: { email: "You" }
        }
        
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(m => m.id === realMessage.id || 
            (m.text === realMessage.text && m.senderId === realMessage.senderId))
          
          if (!exists) {
            return [...prev, realMessage]
          }
          return prev
        })
        
        setLastFetchTime(Date.now()) // Update fetch time to avoid duplicate polling
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      // Restore the message text on error
      setNewMessage(messageText)
    } finally {
      setSending(false)
    }
  }, [newMessage, sending, chatId, currentUserId])

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
                    {isClient 
                      ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : new Date(msg.createdAt).toISOString().slice(11, 16)
                    }
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
