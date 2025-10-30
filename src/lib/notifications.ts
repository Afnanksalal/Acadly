import { prisma } from "./prisma"

export interface NotificationData {
  userId: string
  type: "TRANSACTION" | "DISPUTE" | "REVIEW" | "CHAT" | "ADMIN" | "SYSTEM"
  title: string
  message: string
  data?: Record<string, any>
  actionUrl?: string
}

export async function createNotification(notification: NotificationData) {
  try {
    // For now, we'll just log notifications
    // In a real app, you'd store these in a notifications table
    // and potentially send push notifications, emails, etc.
    
    console.log("📧 Notification:", {
      to: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
    })

    // You could extend this to:
    // 1. Store in database
    // 2. Send email notifications
    // 3. Send push notifications
    // 4. Send SMS for critical notifications
    
    return { success: true }
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
    message: `${transaction.buyer.name || transaction.buyer.email} wants to buy "${transaction.listing.title}"`,
    actionUrl: `/transactions/${transactionId}`,
    data: { transactionId, listingId: transaction.listingId },
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
    actionUrl: `/transactions/${transactionId}`,
    data: { transactionId, amount: transaction.amount },
  })

  // Notify buyer
  await createNotification({
    userId: transaction.buyerId,
    type: "TRANSACTION",
    title: "Payment Successful",
    message: `Your payment for "${transaction.listing.title}" was successful. Waiting for pickup code.`,
    actionUrl: `/transactions/${transactionId}`,
    data: { transactionId, amount: transaction.amount },
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
    actionUrl: `/transactions/${transactionId}`,
    data: { transactionId, pickupCode: transaction.pickup.pickupCode },
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
      actionUrl: `/transactions/${transactionId}`,
      data: { transactionId },
    }),
    createNotification({
      userId: transaction.sellerId,
      type: "TRANSACTION",
      title: "Item Delivered",
      message: `"${transaction.listing.title}" has been successfully delivered.`,
      actionUrl: `/transactions/${transactionId}`,
      data: { transactionId },
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
    actionUrl: `/transactions/${dispute.transactionId}`,
    data: { disputeId, transactionId: dispute.transactionId },
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
        actionUrl: `/admin/disputes/${disputeId}`,
        data: { disputeId, priority: dispute.priority },
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
      actionUrl: `/transactions/${dispute.transactionId}`,
      data: { disputeId, resolution: dispute.resolution },
    }),
    createNotification({
      userId: dispute.transaction.sellerId,
      type: "DISPUTE",
      title: "Dispute Resolved",
      message: `Dispute for "${dispute.transaction.listing.title}" has been ${dispute.status.toLowerCase()}.`,
      actionUrl: `/transactions/${dispute.transactionId}`,
      data: { disputeId, resolution: dispute.resolution },
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
    message: `${review.reviewer.name || review.reviewer.email} left you a ${review.rating}-star review for "${review.transaction.listing.title}"`,
    actionUrl: `/reviews`,
    data: { reviewId, rating: review.rating },
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
    message: `${message.sender.name || message.sender.email} sent you a message about "${message.chat.listing.title}"`,
    actionUrl: `/chats/${message.chatId}`,
    data: { messageId, chatId: message.chatId },
  })
}

// System notifications
export async function notifySystemMaintenance(userIds: string[], message: string) {
  await Promise.all(
    userIds.map(userId =>
      createNotification({
        userId,
        type: "SYSTEM",
        title: "System Maintenance",
        message,
        data: { maintenanceNotice: true },
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
  })
}