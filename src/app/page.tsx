import Link from "next/link"
import { prisma } from "@/lib/prisma"
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
  AlertTriangle,
  ArrowRight,
  Sparkles,
  GraduationCap,
  BookOpen,
  Laptop,
  Headphones,
  Bike,
  Home,
  ChevronRight
} from "lucide-react"

export default async function HomePage() {
  const [categories, recent, stats] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, take: 8 }),
    prisma.listing.findMany({ 
      where: { isActive: true }, 
      orderBy: { createdAt: "desc" }, 
      take: 6, 
      include: { category: true, user: { select: { name: true, verified: true } } } 
    }),
    Promise.all([
      prisma.profile.count(),
      prisma.listing.count({ where: { isActive: true } }),
      prisma.transaction.count({ where: { status: "PAID" } }),
    ]),
  ])

  const [userCount, listingCount, transactionCount] = stats

  // Category icons mapping
  const categoryIcons: Record<string, React.ReactNode> = {
    "Books": <BookOpen className="h-5 w-5" />,
    "Electronics": <Laptop className="h-5 w-5" />,
    "Audio": <Headphones className="h-5 w-5" />,
    "Transport": <Bike className="h-5 w-5" />,
    "Housing": <Home className="h-5 w-5" />,
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section - Full Impact */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                <span>Kerala&apos;s #1 Student Marketplace</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight">
                <span className="block text-foreground">Trade Smart.</span>
                <span className="block mt-2 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  Save More.
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                The trusted marketplace for <span className="text-foreground font-semibold">KTU, CUSAT, MG University</span> students. 
                Buy and sell textbooks, electronics, and more with verified peers.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  href="/listings" 
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90"
                >
                  Start Exploring
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-border font-semibold text-lg hover:border-primary/50 hover:bg-primary/5"
                >
                  Join Free
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <span>Verified Students Only</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <span>Secure Payments</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <span>Instant Chat</span>
                </div>
              </div>
            </div>

            {/* Right Content - Stats Card */}
            <div className="relative px-2 sm:px-0">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-2xl" />
              <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 sm:p-10 shadow-2xl">
                <div className="absolute -top-3 right-2 sm:-top-4 sm:-right-4 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-primary to-secondary rounded-full text-white text-xs sm:text-sm font-bold shadow-lg">
                  LIVE
                </div>
                
                <h3 className="text-2xl font-bold mb-8 text-center">Platform Stats</h3>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {userCount.toLocaleString()}+
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">Students</div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
                      {listingCount.toLocaleString()}+
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">Listings</div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                      {transactionCount.toLocaleString()}+
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">Trades</div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-border/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Trusted by students from</span>
                    <div className="flex -space-x-2">
                      {['KTU', 'CUSAT', 'MG'].map((uni) => (
                        <div key={uni} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-bold text-primary">
                          {uni[0]}
                        </div>
                      ))}
                      <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                        +10
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <Badge variant="outline" className="mb-3">Categories</Badge>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Find What You Need</h2>
            </div>
            <Link href="/listings" className="group inline-flex items-center gap-1 text-primary font-medium hover:gap-2 transition-all">
              View all categories
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category: { id: string; name: string }) => (
              <Link
                key={category.id}
                href={`/listings?category=${encodeURIComponent(category.id)}`}
                className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 p-6 hover:border-primary/50"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                    {categoryIcons[category.name] || <Package className="h-5 w-5" />}
                  </div>
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <Badge variant="outline" className="mb-3">Fresh Drops</Badge>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Just Listed</h2>
            </div>
            <Link href="/listings" className="group inline-flex items-center gap-1 text-primary font-medium hover:gap-2 transition-all">
              See all listings
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recent.map((listing: { 
              id: string; 
              title: string; 
              price: { toLocaleString: () => string }; 
              createdAt: Date; 
              category: { name: string }; 
              user: { name: string | null; verified: boolean } 
            }) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="group relative bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/50"
              >
                {/* Image Placeholder */}
                <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                  <div className="absolute top-3 left-3">
                    <Badge variant="glass" size="sm">{listing.category.name}</Badge>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100">
                    <button className="p-2 rounded-full bg-background/80 backdrop-blur-sm">
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="p-5 space-y-3">
                  <h3 className="font-semibold text-lg line-clamp-1">
                    {listing.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <GraduationCap className="h-3 w-3 text-primary" />
                    </div>
                    <span className="truncate">{listing.user.name || 'Anonymous'}</span>
                    {listing.user.verified && (
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-2xl font-bold text-primary">
                      ₹{listing.price.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Why Acadly?</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Built for <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Students</span>, by Students
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature designed to make campus commerce safe, simple, and social
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            {[
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Verified Students Only",
                description: "College email verification ensures you're trading with real students from your campus",
                color: "emerald"
              },
              {
                icon: <MessageCircle className="h-6 w-6" />,
                title: "Real-Time Chat",
                description: "Negotiate prices, ask questions, and make offers directly within the app",
                color: "blue"
              },
              {
                icon: <CreditCard className="h-6 w-6" />,
                title: "Secure Payments",
                description: "Razorpay integration with escrow protection. UPI, cards, and net banking supported",
                color: "purple"
              },
              {
                icon: <Package className="h-6 w-6" />,
                title: "Safe Pickups",
                description: "Secure 6-digit codes for in-person exchanges. Verify before you hand over",
                color: "orange"
              },
              {
                icon: <Star className="h-6 w-6" />,
                title: "Trust Scores",
                description: "Build your reputation with reviews. See seller ratings before you buy",
                color: "amber"
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: "Price Negotiation",
                description: "Make offers, counter-offers, and negotiate the best deals OLX-style",
                color: "pink"
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative bg-card rounded-2xl border border-border/50 p-8"
              >
                <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-500/10 flex items-center justify-center text-${feature.color}-500 mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Simple Process</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Start Trading in <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">3 Steps</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: "01",
                title: "Sign Up Free",
                description: "Create your account with your college email. Get verified instantly if you're from a recognized institution.",
                icon: <GraduationCap className="h-8 w-8" />
              },
              {
                step: "02", 
                title: "List or Browse",
                description: "Post items you want to sell or browse thousands of listings from fellow students.",
                icon: <Search className="h-8 w-8" />
              },
              {
                step: "03",
                title: "Trade Safely",
                description: "Chat, negotiate, pay securely, and meet up on campus. It's that simple.",
                icon: <ShoppingBag className="h-8 w-8" />
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                {index < 2 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-x-1/2 z-0" />
                )}
                <div className="relative bg-card rounded-2xl border border-border/50 p-8 text-center hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-secondary rounded-full text-white text-sm font-bold">
                    {item.step}
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6 mt-4">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <Badge variant="outline" className="mb-4">Security First</Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                  Your Safety is Our <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Priority</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  Enterprise-grade security features protect every transaction
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: <Lock className="h-5 w-5" />, title: "End-to-End Encryption", desc: "All messages and payment data encrypted" },
                  { icon: <Shield className="h-5 w-5" />, title: "Fraud Protection", desc: "AI-powered scam detection and prevention" },
                  { icon: <AlertTriangle className="h-5 w-5" />, title: "Dispute Resolution", desc: "Fair mediation for any transaction issues" },
                  { icon: <FileText className="h-5 w-5" />, title: "Audit Trail", desc: "Complete transaction history for accountability" },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-2xl" />
              <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { value: "100%", label: "Verified Users", icon: <CheckCircle className="h-5 w-5 text-emerald-500" /> },
                    { value: "24/7", label: "Support", icon: <Bell className="h-5 w-5 text-blue-500" /> },
                    { value: "₹0", label: "Platform Fee", icon: <DollarSign className="h-5 w-5 text-amber-500" /> },
                    { value: "<1min", label: "Response Time", icon: <Clock className="h-5 w-5 text-purple-500" /> },
                  ].map((stat, index) => (
                    <div key={index} className="text-center p-4 rounded-xl bg-muted/50">
                      <div className="flex justify-center mb-2">{stat.icon}</div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="premium" className="mb-6">Join the Community</Badge>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Ready to Start <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">Trading?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of Kerala students already saving money and making connections on Acadly
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/signup" 
              className="group inline-flex items-center justify-center gap-2 px-10 py-5 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1"
            >
              Create Free Account
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/listings" 
              className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-2xl border-2 border-border bg-background/50 backdrop-blur-sm font-bold text-lg hover:border-primary/50 transition-all duration-300"
            >
              Browse Marketplace
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Free forever</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
