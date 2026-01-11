import Link from "next/link"
import { GraduationCap, Twitter, Instagram, Briefcase, Heart, ArrowUpRight, Mail } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="w-full border-t border-border/50 bg-muted/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1 space-y-6">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-secondary">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold font-display tracking-tight">Acadly</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Kerala&apos;s trusted student marketplace. Connect, trade, and thrive in your academic community.
            </p>
            <div className="flex items-center gap-3">
              <a 
                href="#" 
                className="w-10 h-10 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all" 
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all" 
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all" 
                aria-label="LinkedIn"
              >
                <Briefcase className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-5 text-sm uppercase tracking-wider text-muted-foreground">Marketplace</h3>
            <ul className="space-y-3">
              {[
                { href: "/listings", label: "Browse Listings" },
                { href: "/listings/new", label: "Sell an Item" },
                { href: "/events", label: "Campus Events" },
                { href: "/dashboard", label: "Dashboard" },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="group text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-5 text-sm uppercase tracking-wider text-muted-foreground">Legal</h3>
            <ul className="space-y-3">
              {[
                { href: "/policies/terms", label: "Terms of Service" },
                { href: "/policies/privacy", label: "Privacy Policy" },
                { href: "/policies/checkout", label: "Payments & Refunds" },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="group text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-5 text-sm uppercase tracking-wider text-muted-foreground">Get in Touch</h3>
            <div className="space-y-4">
              <a 
                href="mailto:support@acadly.in" 
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                  <Mail className="h-4 w-4 group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Email Us</div>
                  <div className="text-xs">support@acadly.in</div>
                </div>
              </a>
              <p className="text-xs text-muted-foreground pt-2">
                We typically respond within 24 hours during business days.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Acadly. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" />
            <span>for Kerala students</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
