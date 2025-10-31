import { redirect } from "next/navigation"
import { validateUUIDParam } from "@/lib/uuid-validation"

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  // Validate UUID format first
  const validation = validateUUIDParam(params.id, "order")
  if (!validation.isValid) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-semibold mb-4">{validation.error}</h1>
          <a href="/orders" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
            ← Back to Orders
          </a>
        </div>
      </main>
    )
  }

  // Redirect to transactions page
  redirect(`/transactions/${params.id}`)
}
