"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

type Review = {
  id: string
  rating: number
  comment: string | null
  createdAt: Date
  transactionId: string
  reviewer?: {
    id: string
    username: string | null
    email: string | null
    avatarUrl: string | null
  }
  reviewee?: {
    id: string
    username: string | null
    email: string | null
  }
  transaction: {
    listing: {
      id: string
      title: string
    } | null
  }
}

export function ReviewsTabs({
  reviewsReceived,
  reviewsGiven
}: {
  reviewsReceived: Review[]
  reviewsGiven: Review[]
}) {
  const [activeTab, setActiveTab] = useState<"received" | "given">("received")

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("received")}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === "received"
            ? "bg-muted/60 border border-border border-b-transparent"
            : "opacity-80 hover:opacity-100"
            }`}
        >
          Received ({reviewsReceived.length})
        </button>
        <button
          onClick={() => setActiveTab("given")}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === "given"
            ? "bg-muted/60 border border-border border-b-transparent"
            : "opacity-80 hover:opacity-100"
            }`}
        >
          Given ({reviewsGiven.length})
        </button>
      </div>

      {/* Reviews Received */}
      {activeTab === "received" && (
        <div className="space-y-4">
          {reviewsReceived.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-6xl mb-4">⭐</div>
                <p className="text-lg font-medium mb-2">No reviews received yet</p>
                <p className="text-sm text-muted-foreground">
                  Complete transactions to receive reviews from other users
                </p>
              </CardContent>
            </Card>
          ) : (
            reviewsReceived.map((review) => (
              <Card key={review.id} className="hover:border-primary transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Rating */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-xl ${i < review.rating ? "text-secondary" : "text-gray-300"}`}>
                              ★
                            </span>
                          ))}
                        </div>
                        <Badge variant="secondary">
                          {review.rating === 5 ? "Excellent" :
                            review.rating === 4 ? "Very Good" :
                              review.rating === 3 ? "Good" :
                                review.rating === 2 ? "Fair" : "Poor"}
                        </Badge>
                      </div>

                      {/* Comment */}
                      {review.comment && (
                        <p className="text-muted-foreground mb-3">{review.comment}</p>
                      )}

                      {/* Reviewer Info */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>By {review.reviewer?.username || review.reviewer?.email?.split('@')[0]}</span>
                        <span>•</span>
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>

                      {/* Transaction Link */}
                      {review.transaction.listing && (
                        <Link
                          href={`/transactions/${review.transactionId}`}
                          className="text-sm text-primary hover:underline mt-2 inline-block"
                        >
                          For: {review.transaction.listing.title}
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Reviews Given */}
      {activeTab === "given" && (
        <div className="space-y-4">
          {reviewsGiven.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-6xl mb-4">✍️</div>
                <p className="text-lg font-medium mb-2">No reviews given yet</p>
                <p className="text-sm text-muted-foreground">
                  Leave reviews after completing transactions
                </p>
              </CardContent>
            </Card>
          ) : (
            reviewsGiven.map((review) => (
              <Card key={review.id} className="hover:border-primary transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Rating */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-xl ${i < review.rating ? "text-secondary" : "text-gray-300"}`}>
                              ★
                            </span>
                          ))}
                        </div>
                        <Badge variant="secondary">
                          {review.rating === 5 ? "Excellent" :
                            review.rating === 4 ? "Very Good" :
                              review.rating === 3 ? "Good" :
                                review.rating === 2 ? "Fair" : "Poor"}
                        </Badge>
                      </div>

                      {/* Comment */}
                      {review.comment && (
                        <p className="text-muted-foreground mb-3">{review.comment}</p>
                      )}

                      {/* Reviewee Info */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>To {review.reviewee?.username || review.reviewee?.email?.split('@')[0]}</span>
                        <span>•</span>
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>

                      {/* Transaction Link */}
                      {review.transaction.listing && (
                        <Link
                          href={`/transactions/${review.transactionId}`}
                          className="text-sm text-primary hover:underline mt-2 inline-block"
                        >
                          For: {review.transaction.listing.title}
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}