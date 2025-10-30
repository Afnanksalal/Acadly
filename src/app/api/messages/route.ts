import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withVerifiedAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse } from "@/lib/api-response"
import { sendMessageSchema, validateAndSanitizeBody, validatePagination } from "@/lib/validation"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get("chatId")

    if (!chatId) {
      return validationErrorResponse("chatId is required")
    }

    // Pagination
    const { page, limit, skip } = validatePagination({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "50"),
    })

    // Get messages with pagination (most recent first, then reverse for display)
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { chatId },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: { chatId } }),
    ])

    // Reverse to show oldest first
    messages.reverse()

    const totalPages = Math.ceil(total / limit)

    return successResponse(
      messages,
      200,
      {
        page,
        limit,
        total,
        totalPages,
      }
    )
  } catch (error) {
    console.error("Error fetching messages:", error)
    return errorResponse(error, 500)
  }
}

export const POST = withVerifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const data = validateAndSanitizeBody(sendMessageSchema)(body)

    // Verify chat exists and user is a participant
    const chat = await prisma.chat.findUnique({
      where: { id: data.chatId },
      include: {
        listing: true,
      },
    })

    if (!chat) {
      return notFoundResponse("Chat not found")
    }

    if (chat.buyerId !== user.id && chat.sellerId !== user.id) {
      return validationErrorResponse("You are not a participant in this chat")
    }

    // Create message and update chat in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          chatId: data.chatId,
          senderId: user.id,
          text: data.text,
          readStatus: "SENT",
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      })

      // Update chat timestamp
      await tx.chat.update({
        where: { id: data.chatId },
        data: { updatedAt: new Date() },
      })

      return message
    })

    return successResponse(result, 201)
  } catch (error) {
    console.error("Error creating message:", error)
    return errorResponse(error, 500)
  }
})
