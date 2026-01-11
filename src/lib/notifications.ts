import { prisma } from "./prisma"

export interface NotificationData {
  userId: string
  type: "TRANSACTION" | "DISPUTE" | "REVIEW" | "CHAT" | "ADMIN" | "SYSTEM" | "MARKETING" | "SECURITY"
  title: string
  message: string
  data?: Record<string, any>
  actionUrl?: string
}

export async function createNotification(notification: NotificationData & {
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT"
  expiresAt?: Date
}) {
  try {
    // Deduplication: Check for duplicate notifications in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        createdAt: {
          gte: fiveMinutesAgo
        }
      },
      select: { id: true }
    })

    // If duplicate found, skip creation
    if (existingNotification) {
      console.log("⚠️ Duplicate notification prevented:", {
        userId: notification.userId,
        type: notification.type,
        title: notification.title
      })
      return { success: true, notificationId: existingNotification.id, deduplicated: true }
    }

    // Store notification in database
    const dbNotification = await prisma.notification.create({
      data: {
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data ? {
          ...notification.data,
          actionUrl: notification.actionUrl
        } : notification.actionUrl ? { actionUrl: notification.actionUrl } : undefined,
        priority: notification.priority || "NORMAL",
        expiresAt: notification.expiresAt
      }
    })

    console.log("📧 Notification created:", {
      id: dbNotification.id,
      to: notification.userId,
      type: notification.type,
      title: notification.title,
      priority: notification.priority || "NORMAL"
    })
    
    return { success: true, notificationId: dbNotification.id }
  } catch (error) {
    console.error("Error creating notification:", error)
    return { success: false, error }
  }
}

// Transaction notifications
export async function notifyTransactionCreated(transactionId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      buyer: true,
      seller: true,
      listing: true,
    },
  })

  if (!transaction) return

  // Notify seller
  await createNotification({
    userId: transaction.sellerId,
    type: "TRANSACTION",
    title: "New Purchase Order",
    message: `${transaction.buyer.name || transaction.buyer.email?.split('@')[0]} wants to buy "${transaction.listing.title}"`,
    actionUrl: `/orders/${transactionId}`,
    data: { transactionId, listingId: transaction.listingId, amount: transaction.amount },
    priority: "HIGH"
  })
}

export async function notifyPaymentReceived(transactionId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      buyer: true,
      seller: true,
      listing: true,
    },
  })

  if (!transaction) return

  // Notify seller
  await createNotification({
    userId: transaction.sellerId,
    type: "TRANSACTION",
    title: "Payment Received",
    message: `Payment received for "${transaction.listing.title}". Generate pickup code now.`,
    actionUrl: `/orders/${transactionId}`,
    data: { transactionId, amount: transaction.amount },
    priority: "HIGH"
  })

  // Notify buyer
  await createNotification({
    userId: transaction.buyerId,
    type: "TRANSACTION",
    title: "Payment Successful",
    message: `Your payment for "${transaction.listing.title}" was successful. Waiting for pickup code.`,
    actionUrl: `/orders/${transactionId}`,
    data: { transactionId, amount: transaction.amount },
    priority: "NORMAL"
  })
}

export async function notifyPickupCodeGenerated(transactionId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      buyer: true,
      seller: true,
      listing: true,
      pickup: true,
    },
  })

  if (!transaction || !transaction.pickup) return

  // Notify buyer
  await createNotification({
    userId: transaction.buyerId,
    type: "TRANSACTION",
    title: "Pickup Code Ready",
    message: `Your pickup code for "${transaction.listing.title}" is ready: ${transaction.pickup.pickupCode}`,
    actionUrl: `/orders/${transactionId}`,
    data: { transactionId, pickupCode: transaction.pickup.pickupCode },
    priority: "HIGH"
  })
}

export async function notifyPickupConfirmed(transactionId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      buyer: true,
      seller: true,
      listing: true,
    },
  })

  if (!transaction) return

  // Notify both parties
  await Promise.all([
    createNotification({
      userId: transaction.buyerId,
      type: "TRANSACTION",
      title: "Pickup Confirmed",
      message: `Pickup confirmed for "${transaction.listing.title}". You can now leave a review.`,
      actionUrl: `/orders/${transactionId}`,
      data: { transactionId },
      priority: "NORMAL"
    }),
    createNotification({
      userId: transaction.sellerId,
      type: "TRANSACTION",
      title: "Item Delivered",
      message: `"${transaction.listing.title}" has been successfully delivered.`,
      actionUrl: `/orders/${transactionId}`,
      data: { transactionId },
      priority: "NORMAL"
    }),
  ])
}

// Dispute notifications
export async function notifyDisputeCreated(disputeId: string) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      transaction: {
        include: {
          buyer: true,
          seller: true,
          listing: true,
        },
      },
      reporter: true,
    },
  })

  if (!dispute) return

  const otherParty = dispute.reporterId === dispute.transaction.buyerId 
    ? dispute.transaction.seller 
    : dispute.transaction.buyer

  // Notify the other party
  await createNotification({
    userId: otherParty.id,
    type: "DISPUTE",
    title: "Dispute Filed",
    message: `A dispute has been filed for "${dispute.transaction.listing.title}": ${dispute.subject}`,
    actionUrl: `/orders/${dispute.transactionId}`,
    data: { disputeId, transactionId: dispute.transactionId },
    priority: "HIGH"
  })

  // Notify admins
  const admins = await prisma.profile.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  })

  await Promise.all(
    admins.map(admin =>
      createNotification({
        userId: admin.id,
        type: "ADMIN",
        title: "New Dispute",
        message: `New dispute filed: ${dispute.subject}`,
        actionUrl: `/dashboard`,
        data: { disputeId, priority: dispute.priority },
        priority: dispute.priority === "URGENT" ? "URGENT" : dispute.priority === "HIGH" ? "HIGH" : "NORMAL"
      })
    )
  )
}

export async function notifyDisputeResolved(disputeId: string) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      transaction: {
        include: {
          buyer: true,
          seller: true,
          listing: true,
        },
      },
      reporter: true,
    },
  })

  if (!dispute) return

  // Notify both parties
  await Promise.all([
    createNotification({
      userId: dispute.transaction.buyerId,
      type: "DISPUTE",
      title: "Dispute Resolved",
      message: `Dispute for "${dispute.transaction.listing.title}" has been ${dispute.status.toLowerCase()}.`,
      actionUrl: `/orders/${dispute.transactionId}`,
      data: { disputeId, resolution: dispute.resolution },
      priority: "HIGH"
    }),
    createNotification({
      userId: dispute.transaction.sellerId,
      type: "DISPUTE",
      title: "Dispute Resolved",
      message: `Dispute for "${dispute.transaction.listing.title}" has been ${dispute.status.toLowerCase()}.`,
      actionUrl: `/orders/${dispute.transactionId}`,
      data: { disputeId, resolution: dispute.resolution },
      priority: "HIGH"
    }),
  ])
}

// Review notifications
export async function notifyReviewReceived(reviewId: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      reviewer: true,
      reviewee: true,
      transaction: {
        include: {
          listing: true,
        },
      },
    },
  })

  if (!review) return

  await createNotification({
    userId: review.revieweeId,
    type: "REVIEW",
    title: "New Review",
    message: `${review.reviewer.name || review.reviewer.email?.split('@')[0]} left you a ${review.rating}-star review for "${review.transaction.listing.title}"`,
    actionUrl: `/reviews`,
    data: { reviewId, rating: review.rating },
    priority: "NORMAL"
  })
}

// Chat notifications
export async function notifyNewMessage(messageId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      sender: true,
      chat: {
        include: {
          buyer: true,
          seller: true,
          listing: true,
        },
      },
    },
  })

  if (!message) return

  const recipient = message.senderId === message.chat.buyerId 
    ? message.chat.seller 
    : message.chat.buyer

  await createNotification({
    userId: recipient.id,
    type: "CHAT",
    title: "New Message",
    message: `${message.sender.name || message.sender.email?.split('@')[0]} sent you a message about "${message.chat.listing.title}"`,
    actionUrl: `/chats/${message.chatId}`,
    data: { messageId, chatId: message.chatId },
    priority: "NORMAL"
  })
}

// System notifications
export async function notifySystemMaintenance(userIds: string[], message: string, scheduledTime?: Date) {
  await Promise.all(
    userIds.map(userId =>
      createNotification({
        userId,
        type: "SYSTEM",
        title: "System Maintenance",
        message,
        data: { maintenanceNotice: true, scheduledTime },
        priority: "HIGH",
        expiresAt: scheduledTime ? new Date(scheduledTime.getTime() + 24 * 60 * 60 * 1000) : undefined // Expire 24h after maintenance
      })
    )
  )
}

export async function notifyAccountVerified(userId: string) {
  await createNotification({
    userId,
    type: "SYSTEM",
    title: "Account Verified",
    message: "Your account has been verified! You can now access all features.",
    actionUrl: "/dashboard",
    data: { verified: true },
    priority: "HIGH"
  })
}

// Additional notification functions for better user experience
export async function notifyListingApproved(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { user: true }
  })

  if (!listing) return

  await createNotification({
    userId: listing.userId,
    type: "SYSTEM",
    title: "Listing Approved",
    message: `Your listing "${listing.title}" has been approved and is now live!`,
    actionUrl: `/listings/${listingId}`,
    data: { listingId },
    priority: "NORMAL"
  })
}

export async function notifyListingRejected(listingId: string, reason: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { user: true }
  })

  if (!listing) return

  await createNotification({
    userId: listing.userId,
    type: "SYSTEM",
    title: "Listing Rejected",
    message: `Your listing "${listing.title}" was rejected: ${reason}`,
    actionUrl: `/listings/new`,
    data: { listingId, reason },
    priority: "HIGH"
  })
}

export async function notifyNewOffer(offerId: string) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      chat: {
        include: {
          listing: { include: { user: true } },
          buyer: true,
          seller: true
        }
      },
      proposer: true
    }
  })

  if (!offer) return

  const recipient = offer.proposerId === offer.chat.buyerId ? offer.chat.seller : offer.chat.buyer

  await createNotification({
    userId: recipient.id,
    type: "CHAT",
    title: "New Offer",
    message: `${offer.proposer.name || offer.proposer.email?.split('@')[0]} made an offer of ₹${offer.price} for "${offer.chat.listing.title}"`,
    actionUrl: `/chats/${offer.chatId}`,
    data: { offerId, amount: offer.price },
    priority: "HIGH"
  })
}

export async function notifyOfferAccepted(offerId: string) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      chat: {
        include: {
          listing: { include: { user: true } },
          buyer: true,
          seller: true
        }
      },
      proposer: true
    }
  })

  if (!offer) return

  await createNotification({
    userId: offer.proposerId,
    type: "CHAT",
    title: "Offer Accepted",
    message: `Your offer of ₹${offer.price} for "${offer.chat.listing.title}" was accepted!`,
    actionUrl: `/chats/${offer.chatId}`,
    data: { offerId, amount: offer.price },
    priority: "HIGH"
  })
}

export async function notifyOfferResponse(offerId: string, status: 'ACCEPTED' | 'DECLINED' | 'COUNTERED') {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      chat: {
        include: {
          listing: true,
          buyer: true,
          seller: true
        }
      },
      proposer: true
    }
  })

  if (!offer) return

  const statusMessages = {
    ACCEPTED: { title: "Offer Accepted! 🎉", message: `Your offer of ₹${offer.price} for "${offer.chat.listing.title}" was accepted!` },
    DECLINED: { title: "Offer Declined", message: `Your offer of ₹${offer.price} for "${offer.chat.listing.title}" was declined.` },
    COUNTERED: { title: "Counter Offer Received", message: `You received a counter offer for "${offer.chat.listing.title}"` }
  }

  await createNotification({
    userId: offer.proposerId,
    type: "CHAT",
    title: statusMessages[status].title,
    message: statusMessages[status].message,
    actionUrl: `/chats/${offer.chatId}`,
    data: { offerId, amount: offer.price, status },
    priority: status === 'ACCEPTED' ? "HIGH" : "NORMAL"
  })
}

export async function notifySecurityAlert(userId: string, alertType: string, details: string) {
  await createNotification({
    userId,
    type: "SECURITY",
    title: "Security Alert",
    message: `${alertType}: ${details}`,
    actionUrl: "/profile",
    data: { alertType, details },
    priority: "URGENT"
  })
}