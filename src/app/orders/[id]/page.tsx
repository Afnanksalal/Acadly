import { redirect } from "next/navigation"

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  // Redirect to transactions page
  redirect(`/transactions/${params.id}`)
}
