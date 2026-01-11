"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { apiRequest } from "@/lib/api-client"
import { Send, WifiOff, IndianRupee, Check, X, Clock } from "lucide-react"

type Message = {
  id: string
  text: string
  senderId: string
  createdAt: string
  sender: { email: string | null }
}

type Offer = {
  id: string
  price: number
  status: 'PROPOSED' | 'COUNTERED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED'
  proposerId: string
  createdAt: string
  expiresAt: string | null
  proposer: { id: string; username: string | null; name: string | null; avatarUrl: string | null }
}

export function ChatMessages({
  chatId,
  initialMessages,
  currentUserId,
  listingPrice,
}: {
  chatId: string
  initialMessages: Message[]
  currentUserId: string
  listingPrice?: number
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<number>(Date.now())
  const [isOnline, setIsOnline] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const messagesRef = useRef<Message[]>(messages)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Offer state
  const [offers, setOffers] = useState<Offer[]>([])
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [offerPrice, setOfferPrice] = useState("")
  const [offerLoading, setOfferLoading] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
    setIsOnline(navigator.onLine)
    
    const handleOnlineStatus = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('offline', handleOnlineStatus)
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus)
      window.removeEventListener('offline', handleOnlineStatus)
    }
  }, [])

  // Mark messages as read when chat is opened and when new messages arrive
  const markMessagesAsRead = useCallback(async () => {
    if (!isClient) return
    
    try {
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId })
      })
    } catch (error) {
      console.error("Failed to mark messages as read:", error)
    }
  }, [chatId, isClient])

  // Fetch offers for this chat
  const fetchOffers = useCallback(async () => {
    if (!isClient) return
    try {
      const res = await fetch(`/api/offers?chatId=${chatId}`)
      if (res.ok) {
        const response = await res.json()
        const data = response.success ? response.data : response
        if (Array.isArray(data)) {
          setOffers(data)
        }
      }
    } catch (error) {
      console.error("Failed to fetch offers:", error)
    }
  }, [chatId, isClient])

  // Make an offer
  const makeOffer = async () => {
    if (!offerPrice || offerLoading) return
    
    const price = parseFloat(offerPrice)
    if (isNaN(price) || price <= 0) return
    
    setOfferLoading(true)
    try {
      const response = await apiRequest("/api/offers", {
        method: "POST",
        body: JSON.stringify({ chatId, price })
      })
      
      if (response) {
        setOfferPrice("")
        setShowOfferForm(false)
        fetchOffers()
      }
    } catch (error) {
      console.error("Failed to make offer:", error)
    } finally {
      setOfferLoading(false)
    }
  }

  // Respond to an offer
  const respondToOffer = async (offerId: string, status: 'ACCEPTED' | 'DECLINED') => {
    setOfferLoading(true)
    try {
      await apiRequest("/api/offers", {
        method: "PUT",
        body: JSON.stringify({ id: offerId, status })
      })
      fetchOffers()
    } catch (error) {
      console.error("Failed to respond to offer:", error)
    } finally {
      setOfferLoading(false)
    }
  }

  // Cancel own offer
  const cancelOffer = async (offerId: string) => {
    setOfferLoading(true)
    try {
      await apiRequest("/api/offers", {
        method: "PUT",
        body: JSON.stringify({ id: offerId, status: 'CANCELLED' })
      })
      fetchOffers()
    } catch (error) {
      console.error("Failed to cancel offer:", error)
    } finally {
      setOfferLoading(false)
    }
  }

  // Reset messages when chatId changes (navigation between chats)
  useEffect(() => {
    setMessages(initialMessages)
    setLastFetchTime(Date.now())
    // Mark messages as read when entering the chat
    markMessagesAsRead()
    // Fetch offers
    fetchOffers()
  }, [chatId, initialMessages, markMessagesAsRead, fetchOffers])

  // Mark messages as read when new messages arrive from the other user
  useEffect(() => {
    if (messages.length > 0) {
      const hasUnreadFromOthers = messages.some(m => m.senderId !== currentUserId)
      if (hasUnreadFromOthers) {
        markMessagesAsRead()
      }
    }
  }, [messages, currentUserId, markMessagesAsRead])

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
      consecutiveFailures = 0
      if (!document.hidden) {
        setTimeout(() => {
          startPolling()
        }, 1000)
      }
    }

    const handleOffline = () => {
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
          // Check if message already exists by ID only (not content)
          // Content-based deduplication was causing legitimate duplicate messages to be filtered
          const exists = prev.some(m => m.id === realMessage.id)

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

  // Get active offer (most recent PROPOSED or COUNTERED)
  const activeOffer = offers.find(o => o.status === 'PROPOSED' || o.status === 'COUNTERED')
  const canMakeOffer = !activeOffer && listingPrice

  return (
    <div className="flex flex-col h-[70vh] min-h-[400px] max-h-[700px] sm:min-h-[500px]">
      {/* Connection Status */}
      {!isOnline && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center gap-2 text-sm text-destructive">
          <WifiOff className="h-4 w-4" />
          <span>You&apos;re offline. Messages will be sent when you reconnect.</span>
        </div>
      )}

      {/* Active Offer Banner */}
      {activeOffer && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">
                {activeOffer.proposerId === currentUserId ? 'Your offer' : 'Offer received'}: ₹{Number(activeOffer.price).toLocaleString()}
              </span>
              {activeOffer.expiresAt && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Expires {isClient ? new Date(activeOffer.expiresAt).toLocaleDateString() : ''}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {activeOffer.proposerId === currentUserId ? (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => cancelOffer(activeOffer.id)}
                  disabled={offerLoading}
                >
                  Cancel Offer
                </Button>
              ) : (
                <>
                  <Button 
                    size="sm" 
                    onClick={() => respondToOffer(activeOffer.id, 'ACCEPTED')}
                    disabled={offerLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" /> Accept
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => respondToOffer(activeOffer.id, 'DECLINED')}
                    disabled={offerLoading}
                  >
                    <X className="h-4 w-4 mr-1" /> Decline
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Messages - Scrollable area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-muted-foreground">
            <div className="text-4xl sm:text-5xl mb-3">💬</div>
            <p className="text-sm sm:text-base">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isOwn = msg.senderId === currentUserId
              const showDate = index === 0 || 
                new Date(msg.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString()
              
              // Check if this is an offer system message
              const isOfferMessage = msg.text.startsWith('💰') || msg.text.startsWith('🔄') || 
                msg.text.startsWith('✅') || msg.text.startsWith('❌') || 
                msg.text.startsWith('🚫') || msg.text.startsWith('⏰')
              
              return (
                <div key={msg.id}>
                  {/* Date separator */}
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                        {isClient 
                          ? new Date(msg.createdAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
                          : new Date(msg.createdAt).toISOString().slice(0, 10)
                        }
                      </div>
                    </div>
                  )}
                  
                  {isOfferMessage ? (
                    // Offer system message - centered
                    <div className="flex justify-center my-2">
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2 text-sm text-center max-w-[90%]">
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${isOwn
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                        }`}>
                        <p className="text-sm sm:text-base break-words whitespace-pre-wrap">{msg.text}</p>
                        <p className={`text-[10px] sm:text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {isClient
                            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : new Date(msg.createdAt).toISOString().slice(11, 16)
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Offer Form */}
      {showOfferForm && (
        <div className="border-t border-border p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="h-4 w-4" />
            <span className="text-sm font-medium">Make an Offer</span>
            {listingPrice && (
              <span className="text-xs text-muted-foreground">(Listed at ₹{listingPrice.toLocaleString()})</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Enter your offer"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md text-sm"
              min={listingPrice ? listingPrice * 0.1 : 1}
              max={listingPrice ? listingPrice * 2 : undefined}
            />
            <Button onClick={makeOffer} disabled={offerLoading || !offerPrice} size="sm">
              {offerLoading ? '...' : 'Send Offer'}
            </Button>
            <Button variant="outline" onClick={() => setShowOfferForm(false)} size="sm">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-3 sm:p-4 bg-background/95 backdrop-blur-sm">
        <form onSubmit={sendMessage} className="flex gap-2 items-end">
          {/* Make Offer Button */}
          {canMakeOffer && !showOfferForm && (
            <Button 
              type="button"
              variant="outline" 
              size="lg"
              onClick={() => setShowOfferForm(true)}
              className="h-[44px] sm:h-[48px] px-3"
              title="Make an offer"
            >
              <IndianRupee className="h-4 w-4" />
            </Button>
          )}
          
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
              className="w-full px-4 py-3 border rounded-md min-h-[44px] sm:min-h-[48px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (newMessage.trim() && !sending) {
                    sendMessage(e)
                  }
                }
              }}
            />
          </div>
          <Button 
            type="submit" 
            disabled={sending || !newMessage.trim()} 
            size="lg"
            className="h-[44px] sm:h-[48px] px-4 sm:px-6"
          >
            {sending ? (
              <span className="animate-pulse">...</span>
            ) : (
              <>
                <Send className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
