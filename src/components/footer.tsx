import Link from "next/link"

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="w-full border-t border-border bg-muted/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              <span className="text-xl font-bold">collegemart</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your trusted campus marketplace for buying and selling textbooks, electronics, and services.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/listings" className="text-muted-foreground hover:text-primary transition-colors">
                  Browse Listings
                </Link>
              </li>
              <li>
                <Link href="/listings/new" className="text-muted-foreground hover:text-primary transition-colors">
                  Create Listing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/policies/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/checkout" className="text-muted-foreground hover:text-primary transition-colors">
                  Checkout Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:support@collegemart.com" className="text-muted-foreground hover:text-primary transition-colors">
                  support@collegemart.com
                </a>
              </li>
              <li className="flex gap-3 pt-2">
                <a href="#" className="text-2xl hover:scale-110 transition-transform" aria-label="Twitter">
                  🐦
                </a>
                <a href="#" className="text-2xl hover:scale-110 transition-transform" aria-label="Instagram">
                  📷
                </a>
                <a href="#" className="text-2xl hover:scale-110 transition-transform" aria-label="LinkedIn">
                  💼
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} collegemart. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Made with ❤️ for students</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
