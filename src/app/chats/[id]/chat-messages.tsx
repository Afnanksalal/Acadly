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
  
  const [offers, setOffers] = useState<Offer[]>([])
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [offerPrice, setOfferPrice] = useState("")
  const [offerLoading, setOfferLoading] = useState(false)

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

  const markMessagesAsRead = useCallback(async () => {
    if (!isClient) return
    try {
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId })
      })
    } catch {
      // Silent fail
    }
  }, [chatId, isClient])

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
    } catch {
      // Silent fail
    }
  }, [chatId, isClient])

  const makeOffer = async () => {
    if (!offerPrice || offerLoading) return
    
    const price = parseFloat(offerPrice)
    if (isNaN(price) || price <= 0) return
    
    setOfferLoading(true)
    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, price })
      })
      
      if (response.ok) {
        setOfferPrice("")
        setShowOfferForm(false)
        fetchOffers()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to send offer")
      }
    } catch {
      alert("Failed to send offer. Please try again.")
    } finally {
      setOfferLoading(false)
    }
  }

  const respondToOffer = async (offerId: string, status: 'ACCEPTED' | 'DECLINED') => {
    setOfferLoading(true)
    try {
      await apiRequest("/api/offers", {
        method: "PUT",
        body: JSON.stringify({ id: offerId, status })
      })
      fetchOffers()
    } catch {
      alert("Failed to respond to offer")
    } finally {
      setOfferLoading(false)
    }
  }

  const cancelOffer = async (offerId: string) => {
    setOfferLoading(true)
    try {
      await apiRequest("/api/offers", {
        method: "PUT",
        body: JSON.stringify({ id: offerId, status: 'CANCELLED' })
      })
      fetchOffers()
    } catch {
      alert("Failed to cancel offer")
    } finally {
      setOfferLoading(false)
    }
  }

  useEffect(() => {
    setMessages(initialMessages)
    setLastFetchTime(Date.now())
    markMessagesAsRead()
    fetchOffers()
  }, [chatId, initialMessages, markMessagesAsRead, fetchOffers])

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

  useEffect(() => {
    messagesRef.current = messages
    scrollToBottom()
  }, [messages, scrollToBottom])

  const deduplicateMessages = useCallback((newMessages: Message[], existingMessages: Message[]) => {
    const existingIds = new Set(existingMessages.map(m => m.id))
    return newMessages.filter(msg => !existingIds.has(msg.id))
  }, [])

  const fetchNewMessages = useCallback(async () => {
    if (!isClient) return
    try {
      const res = await fetch(`/api/messages?chatId=${chatId}&after=${lastFetchTime}`, { cache: 'no-store' })
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
    } catch {
      // Silent fail
    }
  }, [chatId, lastFetchTime, isClient, deduplicateMessages])

  useEffect(() => {
    if (!isClient) return

    let consecutiveFailures = 0
    const pollInterval = 5000
    let isPollingActive = false

    const getAdaptiveInterval = () => {
      if (consecutiveFailures > 0) {
        return Math.min(pollInterval * Math.pow(1.5, consecutiveFailures), 30000)
      }
      const currentMessages = messagesRef.current
      const timeSinceLastMessage = currentMessages.length > 0
        ? Date.now() - new Date(currentMessages[currentMessages.length - 1].createdAt).getTime()
        : Infinity
      if (timeSinceLastMessage < 5 * 60 * 1000) return 3000
      return 8000
    }

    const startPolling = () => {
      if (isPollingActive || !navigator.onLine || document.hidden) return
      isPollingActive = true

      const poll = async () => {
        if (!isPollingActive) return
        try {
          await fetchNewMessages()
          consecutiveFailures = 0
          if (isPollingActive) {
            intervalRef.current = setTimeout(poll, getAdaptiveInterval())
          }
        } catch {
          consecutiveFailures++
          if (consecutiveFailures >= 5) {
            stopPolling()
            return
          }
          if (isPollingActive) {
            intervalRef.current = setTimeout(poll, getAdaptiveInterval())
          }
        }
      }
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
        fetchNewMessages()
        setTimeout(startPolling, 500)
      }
    }

    const handleOnline = () => {
      consecutiveFailures = 0
      if (!document.hidden) setTimeout(startPolling, 1000)
    }

    const handleOffline = () => stopPolling()

    const initTimeoutId = setTimeout(() => {
      if (!document.hidden && navigator.onLine) startPolling()
    }, 2000)

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
    setNewMessage("")

    try {
      const response = await apiRequest("/api/messages", {
        method: "POST",
        body: JSON.stringify({ chatId, text: messageText })
      })

      if (response) {
        const realMessage: Message = {
          id: response.id || `msg-${Date.now()}`,
          text: messageText,
          senderId: currentUserId,
          createdAt: new Date().toISOString(),
          sender: { email: "You" }
        }
        setMessages(prev => {
          const exists = prev.some(m => m.id === realMessage.id)
          if (!exists) return [...prev, realMessage]
          return prev
        })
        setLastFetchTime(Date.now())
      }
    } catch {
      setNewMessage(messageText)
    } finally {
      setSending(false)
    }
  }, [newMessage, sending, chatId, currentUserId])

  const activeOffer = offers.find(o => o.status === 'PROPOSED' || o.status === 'COUNTERED')
  const canMakeOffer = !activeOffer && listingPrice

  return (
    <div className="flex flex-col h-[70vh] min-h-[400px] max-h-[700px] sm:min-h-[500px]">
      {!isOnline && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center gap-2 text-sm text-destructive">
          <WifiOff className="h-4 w-4" />
          <span>You&apos;re offline. Messages will be sent when you reconnect.</span>
        </div>
      )}

      {activeOffer && (
        <div className="bg-primary/5 border-b border-primary/20 px-3 sm:px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-full">
                <IndianRupee className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-semibold text-primary">₹{Number(activeOffer.price).toLocaleString()}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {activeOffer.proposerId === currentUserId ? 'Your offer' : 'Offer received'}
              </span>
              {activeOffer.expiresAt && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {isClient ? new Date(activeOffer.expiresAt).toLocaleDateString() : ''}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {activeOffer.proposerId === currentUserId ? (
                <Button size="sm" variant="outline" onClick={() => cancelOffer(activeOffer.id)} disabled={offerLoading} className="text-xs">
                  Cancel
                </Button>
              ) : (
                <>
                  <Button size="sm" onClick={() => respondToOffer(activeOffer.id, 'ACCEPTED')} disabled={offerLoading} className="bg-green-600 hover:bg-green-700 text-xs">
                    <Check className="h-3.5 w-3.5 mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => respondToOffer(activeOffer.id, 'DECLINED')} disabled={offerLoading} className="text-xs">
                    <X className="h-3.5 w-3.5 mr-1" /> Decline
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
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
              const showDate = index === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString()
              const isOfferMessage = msg.text.startsWith('💰') || msg.text.startsWith('🔄') || msg.text.startsWith('✅') || msg.text.startsWith('❌') || msg.text.startsWith('🚫') || msg.text.startsWith('⏰')
              
              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                        {isClient ? new Date(msg.createdAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : new Date(msg.createdAt).toISOString().slice(0, 10)}
                      </div>
                    </div>
                  )}
                  
                  {isOfferMessage ? (
                    <div className="flex justify-center my-2">
                      <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 text-sm text-center max-w-[90%]">
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${isOwn ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"}`}>
                        <p className="text-sm sm:text-base break-words whitespace-pre-wrap">{msg.text}</p>
                        <p className={`text-[10px] sm:text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {isClient ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(msg.createdAt).toISOString().slice(11, 16)}
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

      {showOfferForm && (
        <div className="border-t border-border p-3 sm:p-4 bg-primary/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Make an Offer</span>
            </div>
            <button onClick={() => setShowOfferForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          {listingPrice && <p className="text-xs text-muted-foreground mb-3">Listed price: ₹{listingPrice.toLocaleString()}</p>}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <input
                type="number"
                placeholder="Enter amount"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                min={1}
              />
            </div>
            <Button onClick={makeOffer} disabled={offerLoading || !offerPrice} size="sm" className="px-4">
              {offerLoading ? '...' : 'Send'}
            </Button>
          </div>
        </div>
      )}

      <div className="border-t border-border p-3 sm:p-4 bg-background">
        <form onSubmit={sendMessage} className="flex gap-2 items-center">
          {canMakeOffer && !showOfferForm && (
            <button 
              type="button"
              onClick={() => setShowOfferForm(true)}
              className="flex-shrink-0 h-11 w-11 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted transition-colors"
              title="Make an offer"
            >
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            className="flex-1 min-w-0 px-4 py-2.5 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (newMessage.trim() && !sending) sendMessage(e)
              }
            }}
          />
          <Button type="submit" disabled={sending || !newMessage.trim()} size="sm" className="flex-shrink-0 h-11 px-4">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
