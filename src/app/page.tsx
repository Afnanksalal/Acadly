import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function HomePage() {
  const [categories, recent] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, take: 12 }),
    prisma.listing.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 9, include: { category: true } }),
  ])
  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-10 md:space-y-16">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center animate-fade-in">
        <div className="space-y-4 md:space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Buy & sell within your campus</h1>
          <p className="text-base md:text-lg text-muted-foreground">Textbooks, calculators, electronics, services—trusted by verified students.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-all hover-lift text-center" href="/listings">Browse Listings</Link>
            <Link className="px-6 py-3 rounded-lg border-2 border-border font-medium hover:border-primary transition-all text-center" href="/auth/signup">Get Started</Link>
          </div>
        </div>
        <Card className="hidden md:block animate-scale-in">
          <CardHeader><CardTitle className="text-xl">Why collegemart?</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-border p-4 hover:border-primary transition-all hover-lift">✓ Verified users only</div>
            <div className="rounded-lg border border-border p-4 hover:border-primary transition-all hover-lift">💬 In-app offers & chat</div>
            <div className="rounded-lg border border-border p-4 hover:border-primary transition-all hover-lift">🔒 Secure payments</div>
            <div className="rounded-lg border border-border p-4 hover:border-primary transition-all hover-lift">📍 Local pickups</div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6 animate-slide-in">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Featured Categories</h2>
          <Link href="/listings" className="text-sm text-primary hover:underline font-medium">View all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {categories.map((c) => (
            <Link key={c.id} href={`/listings?category=${encodeURIComponent(c.id)}`} className="rounded-lg border border-border p-4 text-center font-medium hover:border-primary transition-all hover-lift">
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-6 animate-slide-in">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Recent Listings</h2>
          <Link href="/listings" className="text-sm text-primary hover:underline font-medium">See more →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recent.map((l) => (
            <Link key={l.id} href={`/listings/${l.id}`} className="rounded-lg border border-border p-5 space-y-3 hover:border-primary transition-all hover-lift">
              <div className="text-lg font-semibold line-clamp-2">{l.title}</div>
              <div className="text-sm text-muted-foreground">{l.category.name}</div>
              <div className="text-xl font-bold text-primary">₹{l.price.toString()}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
