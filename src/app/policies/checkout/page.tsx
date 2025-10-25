import { Card, CardContent } from "@/components/ui/card"

export default function CheckoutPolicyPage() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <Card>
        <CardContent className="p-8 space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Checkout & Refund Policy</h1>
            <p className="text-muted-foreground">Last updated: October 2025</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Payment Processing</h2>
            <p className="text-muted-foreground">
              All payments are securely processed through Razorpay, our trusted payment gateway partner.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Payments are processed directly to the seller</li>
              <li>We support UPI, credit/debit cards, and net banking</li>
              <li>All transactions are encrypted and secure</li>
              <li>Payment confirmation is sent via email</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Platform Fees</h2>
            <p className="text-muted-foreground">
              Currently, collegemart does not charge any platform commission or service fees. Sellers receive 100% of the
              listing price.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Pickup and Delivery</h2>
            <p className="text-muted-foreground">
              After payment, a unique pickup code is generated for local pickup transactions.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Buyer receives a pickup code via email and dashboard</li>
              <li>Seller confirms pickup by entering the code</li>
              <li>Meet in safe, public locations on campus</li>
              <li>Verify item condition before confirming pickup</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Refund Policy</h2>
            <p className="text-muted-foreground">
              Refunds are handled on a case-by-case basis through our dispute resolution system.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Refunds available if item is significantly not as described</li>
              <li>Refunds available if seller fails to deliver</li>
              <li>File a dispute within 7 days of transaction</li>
              <li>Admin team reviews all dispute cases</li>
              <li>Refunds processed within 5-7 business days if approved</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Dispute Resolution</h2>
            <p className="text-muted-foreground">
              If you have an issue with a transaction:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
              <li>First, try to resolve directly with the other party</li>
              <li>If unsuccessful, file a dispute from your transaction details</li>
              <li>Provide evidence (photos, messages, etc.)</li>
              <li>Admin team reviews within 2-3 business days</li>
              <li>Decision is final and binding</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Cancellations</h2>
            <p className="text-muted-foreground">
              Buyers can cancel before pickup is confirmed. Sellers can cancel if buyer doesn&apos;t show up within agreed timeframe.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Buyer cancellation: Full refund if before pickup</li>
              <li>Seller cancellation: Automatic full refund to buyer</li>
              <li>No-show penalty: May affect user rating</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Safety Tips</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Meet in well-lit, public areas on campus</li>
              <li>Bring a friend if possible</li>
              <li>Inspect items before confirming pickup</li>
              <li>Don&apos;t share personal financial information</li>
              <li>Report suspicious activity immediately</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Contact</h2>
            <p className="text-muted-foreground">
              For questions about payments or refunds, contact us at{" "}
              <a href="mailto:payments@collegemart.com" className="text-primary underline">payments@collegemart.com</a>
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  )
}
