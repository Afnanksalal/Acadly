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
  const messagesRef = useRef<Message[]>(messages)

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

  // Update messages ref and scroll to bottom when new messages arrive
  useEffect(() => {
    messagesRef.current = messages
    scrollToBottom()
  }, [messages, scrollToBottom])

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

  // Optimized real-time polling with exponential backoff and smart intervals
  useEffect(() => {
    if (!isClient) return

    let consecutiveFailures = 0
    const pollInterval = 5000 // Start with 5 seconds (reduced frequency)
    let isPollingActive = false

    const getAdaptiveInterval = () => {
      // Exponential backoff on failures, but cap at reasonable limits
      if (consecutiveFailures > 0) {
        return Math.min(pollInterval * Math.pow(1.5, consecutiveFailures), 30000) // Max 30 seconds
      }

      // Adaptive interval based on activity
      const currentMessages = messagesRef.current
      const timeSinceLastMessage = currentMessages.length > 0
        ? Date.now() - new Date(currentMessages[currentMessages.length - 1].createdAt).getTime()
        : Infinity

      // More frequent polling if recent activity (within 5 minutes)
      if (timeSinceLastMessage < 5 * 60 * 1000) {
        return 3000 // 3 seconds for active chats
      }

      return 8000 // 8 seconds for inactive chats
    }

    const startPolling = () => {
      if (isPollingActive || !navigator.onLine || document.hidden) return

      isPollingActive = true

      const poll = async () => {
        if (!isPollingActive) return

        try {
          await fetchNewMessages()
          consecutiveFailures = 0

          // Schedule next poll
          if (isPollingActive) {
            intervalRef.current = setTimeout(poll, getAdaptiveInterval())
          }
        } catch (error) {
          consecutiveFailures++
          console.warn(`Chat polling failed (${consecutiveFailures}/5):`, error)

          if (consecutiveFailures >= 5) {
            console.error("Chat polling disabled due to repeated failures")
            stopPolling()
            return
          }

          // Retry with backoff
          if (isPollingActive) {
            intervalRef.current = setTimeout(poll, getAdaptiveInterval())
          }
        }
      }

      // Start first poll after a short delay
      intervalRef.current = setTimeout(poll, 1000)
    }

    const stopPolling = () => {
      isPollingActive = false
      if (intervalRef.current) {
        clearTimeout(intervalRef.current)
        intervalRef.current = null
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        consecutiveFailures = 0
        fetchNewMessages() // Immediate fetch when tab becomes visible
        setTimeout(startPolling, 500) // Small delay to avoid race conditions
      }
    }

    const handleOnline = () => {
      console.log("Connection restored, resuming chat polling")
      consecutiveFailures = 0
      if (!document.hidden) {
        setTimeout(startPolling, 1000)
      }
    }

    const handleOffline = () => {
      console.log("Connection lost, pausing chat polling")
      stopPolling()
    }

    // Start polling after component is ready
    const initTimeoutId = setTimeout(() => {
      if (!document.hidden && navigator.onLine) {
        startPolling()
      }
    }, 2000)

    // Event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearTimeout(initTimeoutId)
      stopPolling()
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
                <div className={`max-w-[70%] rounded-lg p-3 ${isOwn
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
