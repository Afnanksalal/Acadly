import { Card, CardContent } from "@/components/ui/card"
import { Metadata } from "next"
import { Shield, CreditCard, Package, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Checkout & Refund Policy | Acadly",
  description: "Payment processing, refunds, and transaction policies for Acadly"
}

export default function CheckoutPolicyPage() {
  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6">
      <Card>
        <CardContent className="p-6 sm:p-8 space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Checkout & Refund Policy</h1>
            <p className="text-muted-foreground">Last updated: January 2026</p>
          </div>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-primary" />
              <h2 className="text-xl sm:text-2xl font-semibold">1. Payment Processing</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              All payments on Acadly are securely processed through Razorpay, India&apos;s leading payment gateway. 
              Your financial information is never stored on our servers.
            </p>
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h3 className="font-medium">Supported Payment Methods:</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  UPI (Google Pay, PhonePe, Paytm)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Credit Cards (Visa, Mastercard, RuPay)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Debit Cards
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Net Banking (All major banks)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Wallets (Paytm, Mobikwik)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  EMI (on eligible cards)
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-xl sm:text-2xl font-semibold">2. Payment Security</h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>All transactions are encrypted with 256-bit SSL</li>
              <li>PCI DSS compliant payment processing</li>
              <li>Two-factor authentication for high-value transactions</li>
              <li>Real-time fraud detection and prevention</li>
              <li>Secure tokenization - we never store your card details</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">3. Platform Fees</h2>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-green-400 font-medium">
                🎉 Currently, Acadly charges ZERO platform fees!
              </p>
              <p className="text-muted-foreground mt-2">
                Sellers receive 100% of the listing price. Standard payment gateway charges 
                (typically 2% for cards, free for UPI) may apply as per Razorpay&apos;s terms.
              </p>
            </div>
            <p className="text-muted-foreground text-sm">
              Note: Platform fees may be introduced in the future. Users will be notified in advance of any changes.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-primary" />
              <h2 className="text-xl sm:text-2xl font-semibold">4. Pickup Process</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Acadly uses a secure pickup code system to ensure safe transactions:
            </p>
            <div className="space-y-4 mt-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">1</div>
                <div>
                  <h4 className="font-medium">Payment Confirmed</h4>
                  <p className="text-muted-foreground text-sm">Buyer completes payment through Razorpay</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">2</div>
                <div>
                  <h4 className="font-medium">Pickup Code Generated</h4>
                  <p className="text-muted-foreground text-sm">Buyer receives a unique 6-digit pickup code via email and dashboard</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">3</div>
                <div>
                  <h4 className="font-medium">Arrange Meetup</h4>
                  <p className="text-muted-foreground text-sm">Buyer and seller coordinate pickup time and location via chat</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">4</div>
                <div>
                  <h4 className="font-medium">Verify & Confirm</h4>
                  <p className="text-muted-foreground text-sm">Buyer inspects item, then shares code with seller to confirm pickup</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold shrink-0">✓</div>
                <div>
                  <h4 className="font-medium">Transaction Complete</h4>
                  <p className="text-muted-foreground text-sm">Seller enters code to confirm delivery. Transaction is marked complete.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 text-primary" />
              <h2 className="text-xl sm:text-2xl font-semibold">5. Refund Policy</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Refunds are processed through our dispute resolution system on a case-by-case basis.
            </p>
            
            <h3 className="text-lg font-medium mt-4">Eligible for Refund:</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Item significantly not as described in the listing</li>
              <li>Seller fails to deliver within agreed timeframe</li>
              <li>Item is damaged, defective, or counterfeit</li>
              <li>Seller cancels the transaction</li>
              <li>Duplicate or erroneous charges</li>
            </ul>

            <h3 className="text-lg font-medium mt-4">Not Eligible for Refund:</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Buyer&apos;s remorse or change of mind</li>
              <li>Minor variations from listing photos</li>
              <li>Issues reported after pickup confirmation</li>
              <li>Disputes filed after 7 days</li>
              <li>Items damaged after pickup</li>
            </ul>

            <h3 className="text-lg font-medium mt-4">Refund Timeline:</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Dispute review: 2-3 business days</li>
              <li>Refund processing: 5-7 business days after approval</li>
              <li>Bank credit: Additional 3-5 business days (varies by bank)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-primary" />
              <h2 className="text-xl sm:text-2xl font-semibold">6. Dispute Resolution</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              If you encounter an issue with a transaction:
            </p>
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground ml-4">
              <li>
                <strong>Contact the other party first</strong> - Many issues can be resolved through direct communication via our chat system.
              </li>
              <li>
                <strong>File a dispute</strong> - If direct resolution fails, file a dispute from your transaction details page within 7 days.
              </li>
              <li>
                <strong>Provide evidence</strong> - Upload photos, screenshots of conversations, and any other relevant documentation.
              </li>
              <li>
                <strong>Admin review</strong> - Our moderation team will review the case and may contact both parties for additional information.
              </li>
              <li>
                <strong>Resolution</strong> - We will issue a decision within 5 business days. Decisions are final and binding.
              </li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">7. Cancellations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-medium mb-2">Buyer Cancellation</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Before pickup: Full refund</li>
                  <li>• After pickup confirmation: No refund</li>
                  <li>• Frequent cancellations may affect account standing</li>
                </ul>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-medium mb-2">Seller Cancellation</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Automatic full refund to buyer</li>
                  <li>• May affect seller rating</li>
                  <li>• Repeated cancellations may result in restrictions</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">8. Safety Guidelines</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <h3 className="font-medium text-yellow-400 mb-3">⚠️ Stay Safe During Transactions</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                  <span>Meet in well-lit, public areas on campus (library, cafeteria, admin building)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                  <span>Bring a friend if meeting someone for the first time</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                  <span>Inspect items thoroughly before confirming pickup</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                  <span>Never share your pickup code until you have the item</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                  <span>Don&apos;t share personal financial information outside the platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                  <span>Report suspicious behavior immediately</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">9. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For payment or refund inquiries:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Email: <a href="mailto:payments@acadly.in" className="text-primary hover:underline">payments@acadly.in</a></li>
              <li>General Support: <a href="mailto:support@acadly.in" className="text-primary hover:underline">support@acadly.in</a></li>
            </ul>
            <p className="text-muted-foreground text-sm mt-4">
              Response time: Within 24-48 hours on business days
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  )
}
