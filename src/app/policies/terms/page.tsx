import { Card, CardContent } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <Card>
        <CardContent className="p-8 space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: October 2025</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using collegemart, you accept and agree to be bound by the terms and provision of this agreement.
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. User Accounts</h2>
            <p className="text-muted-foreground">
              You must create an account to use certain features. You are responsible for maintaining the confidentiality of your
              account credentials and for all activities that occur under your account.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Provide accurate and complete information</li>
              <li>Keep your account credentials secure</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>You must be a student or affiliated with a college/university</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Listings and Transactions</h2>
            <p className="text-muted-foreground">
              Users may create listings for products and services. All transactions are between buyers and sellers directly.
              collegemart is not responsible for the quality, safety, or legality of items listed.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>You must own or have permission to sell items you list</li>
              <li>Listings must be accurate and not misleading</li>
              <li>Prohibited items include illegal goods, weapons, and stolen property</li>
              <li>Local pickup is recommended; shipping is at your own risk</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Payment and Fees</h2>
            <p className="text-muted-foreground">
              Payment processing is handled through Razorpay. collegemart may charge service fees for transactions.
              All fees are non-refundable unless otherwise stated.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. User Conduct</h2>
            <p className="text-muted-foreground">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Post false, misleading, or fraudulent content</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to hack or disrupt the platform</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Disputes</h2>
            <p className="text-muted-foreground">
              If you have a dispute with another user, you should first attempt to resolve it directly. If unsuccessful,
              you may file a dispute through our platform. Our admin team will review and mediate disputes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              collegemart is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages arising from
              your use of the platform, including but not limited to direct, indirect, incidental, or consequential damages.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Termination</h2>
            <p className="text-muted-foreground">
              We reserve the right to suspend or terminate your account at any time for violating these terms or for any other
              reason at our discretion.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance
              of the new terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these terms, contact us at <a href="mailto:support@collegemart.com" className="text-primary underline">support@collegemart.com</a>
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  )
}
