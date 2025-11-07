import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  MessageCircle, 
  Lock, 
  MapPin, 
  Shield, 
  Zap, 
  Users, 
  Star,
  TrendingUp,
  Bell,
  FileText,
  CreditCard,
  Search,
  Package,
  Award,
  Clock,
  DollarSign,
  ShoppingBag,
  Heart,
  AlertTriangle
} from "lucide-react"

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

      {/* Comprehensive Features Section */}
      <section className="space-y-6 sm:space-y-8 animate-slide-in">
        <div className="text-center space-y-2 sm:space-y-3">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Everything You Need for Campus Commerce</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            A complete marketplace platform built specifically for academic communities with powerful features for buyers, sellers, and administrators
          </p>
        </div>

        {/* Core Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="hover-lift">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                </div>
                <CardTitle className="text-base sm:text-lg">Real-Time Chat</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Negotiate prices, ask questions, and make offers directly with sellers. Built-in chat with message history and notifications.</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CreditCard className="h-5 w-5 text-green-500" />
                </div>
                <CardTitle className="text-base sm:text-lg">Secure Payments</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Integrated Razorpay payment gateway with escrow protection. Multiple payment methods including UPI, cards, and net banking.</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Shield className="h-5 w-5 text-purple-500" />
                </div>
                <CardTitle className="text-base sm:text-lg">Dispute Resolution</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Fair dispute handling system with evidence submission, priority levels, and admin mediation for transaction issues.</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
                <CardTitle className="text-base sm:text-lg">Review System</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Rate and review buyers and sellers after transactions. Build trust with verified reviews and reputation scores.</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <CardTitle className="text-base sm:text-lg">Report System</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Report inappropriate content, scams, or policy violations. Multi-level priority system with admin review.</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <Bell className="h-5 w-5 text-indigo-500" />
                </div>
                <CardTitle className="text-base sm:text-lg">Smart Notifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Stay updated with real-time notifications for messages, transactions, disputes, and system announcements.</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Package className="h-5 w-5 text-orange-500" />
                </div>
                <CardTitle className="text-base sm:text-lg">Pickup Codes</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Secure 6-digit pickup codes generated after payment. Verify transactions safely during in-person exchanges.</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/10">
                  <Heart className="h-5 w-5 text-pink-500" />
                </div>
                <CardTitle className="text-base sm:text-lg">Wishlist & Favorites</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Save listings you're interested in. Get notified when prices drop or similar items are listed.</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10">
                  <Search className="h-5 w-5 text-teal-500" />
                </div>
                <CardTitle className="text-base sm:text-lg">Advanced Search</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Filter by category, price range, condition, and location. Sort by relevance, price, or date posted.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Transaction Features */}
      <section className="space-y-6 sm:space-y-8 animate-slide-in">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="mb-2">Transaction Management</Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Complete Transaction Lifecycle</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            From browsing to delivery, every step is tracked and secured
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Transaction Timeout Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">Automatic cleanup of expired transactions after 30 minutes. Listings are automatically reactivated if payment isn't completed.</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Auto-cleanup</Badge>
                <Badge variant="secondary">Listing reactivation</Badge>
                <Badge variant="secondary">Audit trail</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Flexible Refund System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">Full and partial refunds supported. Admin-controlled refund processing with automatic transaction status updates.</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Full refunds</Badge>
                <Badge variant="secondary">Partial refunds</Badge>
                <Badge variant="secondary">Admin approval</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Transaction Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">Configurable daily transaction limits to prevent spam and abuse. Customizable per user or globally by admins.</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Spam prevention</Badge>
                <Badge variant="secondary">Configurable limits</Badge>
                <Badge variant="secondary">User protection</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Auto-Complete System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">Transactions auto-complete after 7 days if pickup isn't confirmed. Ensures smooth closure and prevents indefinite pending states.</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">7-day auto-complete</Badge>
                <Badge variant="secondary">Pickup confirmation</Badge>
                <Badge variant="secondary">Status tracking</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Admin Features */}
      <section className="space-y-6 sm:space-y-8 animate-slide-in bg-muted/30 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 py-8 sm:py-12 rounded-lg">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="mb-2">For Administrators</Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Powerful Admin Dashboard</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Complete platform management with analytics, moderation, and system monitoring
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-lift">
            <CardContent className="pt-6 text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-semibold">Analytics Dashboard</h3>
              <p className="text-xs text-muted-foreground">Revenue tracking, user growth, listing activity, and performance metrics</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardContent className="pt-6 text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-semibold">User Management</h3>
              <p className="text-xs text-muted-foreground">Verify users, manage roles, bulk actions, and advanced user controls</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardContent className="pt-6 text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-semibold">Content Moderation</h3>
              <p className="text-xs text-muted-foreground">Review reports, resolve disputes, manage listings with priority queues</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardContent className="pt-6 text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="font-semibold">Audit Logs</h3>
              <p className="text-xs text-muted-foreground">Complete activity tracking, admin actions, and system event logging</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-primary">Real-time</div>
            <div className="text-xs text-muted-foreground">Metrics</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-primary">Financial</div>
            <div className="text-xs text-muted-foreground">Overview</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-primary">System</div>
            <div className="text-xs text-muted-foreground">Monitor</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-primary">Announcements</div>
            <div className="text-xs text-muted-foreground">Management</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-primary">Settings</div>
            <div className="text-xs text-muted-foreground">Control</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-primary">Backup</div>
            <div className="text-xs text-muted-foreground">System</div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="space-y-6 sm:space-y-8 animate-slide-in">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="mb-2">Security & Trust</Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Built with Security in Mind</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade security features to protect your data and transactions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="hover-lift border-green-500/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Email Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Mandatory email verification for all users. Critical actions require verified accounts to prevent fraud.</p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-500" />
                Webhook Security
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Timing-safe signature validation for payment webhooks. Protection against timing attacks and fraud.</p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                Input Sanitization
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>XSS prevention, HTML sanitization, and prototype pollution protection on all user inputs.</p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-yellow-500/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Rate Limiting
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Redis-backed rate limiting with memory fallback. Different limits for different endpoints.</p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-red-500/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Image Validation
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Server-side MIME type validation, magic number checking, and file size limits to prevent malicious uploads.</p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-indigo-500/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Complete audit logging for all critical operations. Transaction history preserved for compliance.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Listings */}
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

      {/* CTA Section */}
      <section className="text-center space-y-6 py-12 sm:py-16 animate-fade-in">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Ready to Get Started?</h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
          Join thousands of students already buying and selling on Acadly. Create your account in seconds and start trading today.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link className="px-6 sm:px-8 py-3 sm:py-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all hover-lift text-center" href="/auth/signup">
            Create Free Account
          </Link>
          <Link className="px-6 sm:px-8 py-3 sm:py-4 rounded-lg border-2 border-primary/20 font-medium hover:border-primary transition-all text-center text-foreground" href="/listings">
            Browse Marketplace
          </Link>
        </div>
      </section>
    </main>
  )
}
