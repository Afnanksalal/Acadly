import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, MessageCircle, Lock, MapPin } from "lucide-react"

export default async function HomePage() {
  const [categories, recent] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, take: 12 }),
    prisma.listing.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 9, include: { category: true } }),
  ])
  return (
    <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-6 space-y-6 sm:space-y-10 lg:space-y-16">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-center animate-fade-in">
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Connect, Trade, and Thrive in Your Academic Community</h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">Your trusted platform for campus commerce. Buy and sell textbooks, electronics, and services with verified students.</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Link className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all hover-lift text-center text-sm sm:text-base" href="/listings">Browse Listings</Link>
            <Link className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg border-2 border-primary/20 font-medium hover:border-primary transition-all text-center text-foreground text-sm sm:text-base" href="/auth/signup">Get Started</Link>
          </div>
        </div>
        <Card className="animate-scale-in">
          <CardHeader><CardTitle>Why Acadly?</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="rounded-lg border border-primary/10 p-2 sm:p-3 lg:p-4 hover:border-primary/30 transition-all hover-lift flex items-center gap-1 sm:gap-2 bg-muted/20">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 flex-shrink-0" />
              <span className="truncate">Verified users</span>
            </div>
            <div className="rounded-lg border border-primary/10 p-2 sm:p-3 lg:p-4 hover:border-primary/30 transition-all hover-lift flex items-center gap-1 sm:gap-2 bg-muted/20">
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
              <span className="truncate">In-app chat</span>
            </div>
            <div className="rounded-lg border border-primary/10 p-2 sm:p-3 lg:p-4 hover:border-primary/30 transition-all hover-lift flex items-center gap-1 sm:gap-2 bg-muted/20">
              <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
              <span className="truncate">Secure payments</span>
            </div>
            <div className="rounded-lg border border-primary/10 p-2 sm:p-3 lg:p-4 hover:border-primary/30 transition-all hover-lift flex items-center gap-1 sm:gap-2 bg-muted/20">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-red-400 flex-shrink-0" />
              <span className="truncate">Local pickups</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4 sm:space-y-6 animate-slide-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">Featured Categories</h2>
          <Link href="/listings" className="text-xs sm:text-sm text-primary hover:underline font-medium">View all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {categories.map((c) => (
            <Link key={c.id} href={`/listings?category=${encodeURIComponent(c.id)}`} className="rounded-lg border border-primary/10 p-3 sm:p-4 text-center font-medium hover:border-primary/30 transition-all hover-lift text-xs sm:text-sm">
              <span className="line-clamp-2">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4 sm:space-y-6 animate-slide-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">Recent Listings</h2>
          <Link href="/listings" className="text-xs sm:text-sm text-primary hover:underline font-medium">See more →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {recent.map((l) => (
            <Link key={l.id} href={`/listings/${l.id}`} className="rounded-lg border border-primary/10 p-3 sm:p-4 lg:p-5 space-y-2 sm:space-y-3 hover:border-primary/30 transition-all hover-lift">
              <div className="text-sm sm:text-base lg:text-lg font-semibold line-clamp-2">{l.title}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{l.category.name}</div>
              <div className="text-base sm:text-lg lg:text-xl font-bold text-primary">₹{l.price.toString()}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
