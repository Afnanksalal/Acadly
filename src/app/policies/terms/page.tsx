import { Card, CardContent } from "@/components/ui/card"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | Acadly",
  description: "Terms of Service for Acadly - Campus Marketplace for Students"
}

export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6">
      <Card>
        <CardContent className="p-6 sm:p-8 space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: January 2026</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to Acadly! By accessing or using our platform at acadly.in, you agree to be bound by these Terms of Service. 
              If you disagree with any part of these terms, you may not access our service. These terms apply to all users, 
              including buyers, sellers, and visitors.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">2. Eligibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              Acadly is designed exclusively for college and university students in India. To use our platform:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>You must be at least 18 years old</li>
              <li>You must be currently enrolled in or affiliated with a recognized educational institution</li>
              <li>You must use a valid college email address for verification (when available)</li>
              <li>You must provide accurate and truthful information during registration</li>
              <li>You must not have been previously banned from the platform</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you create an account with us, you must provide accurate, complete, and current information. 
              You are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access or security breach</li>
              <li>Keeping your profile information up to date</li>
              <li>Not sharing your account with others or creating multiple accounts</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Account verification may be required before you can buy, sell, or message other users. 
              Verification helps maintain trust and safety within our community.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">4. Listings and Transactions</h2>
            <p className="text-muted-foreground leading-relaxed">
              Acadly provides a platform for students to buy and sell products and services. 
              All transactions are between buyers and sellers directly.
            </p>
            <h3 className="text-lg font-medium mt-4">For Sellers:</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>You must own or have legal rights to sell items you list</li>
              <li>Listings must be accurate, honest, and not misleading</li>
              <li>Images must accurately represent the item being sold</li>
              <li>Prices must be clearly stated in Indian Rupees (₹)</li>
              <li>You must respond to buyer inquiries in a timely manner</li>
              <li>You must honor confirmed transactions and deliver as promised</li>
            </ul>
            <h3 className="text-lg font-medium mt-4">For Buyers:</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Review listings carefully before purchasing</li>
              <li>Ask questions if anything is unclear</li>
              <li>Complete payment promptly after committing to buy</li>
              <li>Inspect items during pickup before confirming receipt</li>
              <li>Provide honest reviews based on your experience</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">5. Prohibited Items and Activities</h2>
            <p className="text-muted-foreground leading-relaxed">
              The following items and activities are strictly prohibited on Acadly:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Illegal items, drugs, or controlled substances</li>
              <li>Weapons, ammunition, or explosives</li>
              <li>Stolen property or items obtained illegally</li>
              <li>Counterfeit or pirated goods</li>
              <li>Academic fraud materials (fake certificates, plagiarized work)</li>
              <li>Adult content or services</li>
              <li>Hazardous materials</li>
              <li>Items that infringe intellectual property rights</li>
              <li>Fraudulent listings or scam attempts</li>
              <li>Price manipulation or fake reviews</li>
              <li>Harassment, hate speech, or discrimination</li>
              <li>Spam or unsolicited advertising</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">6. Payment and Fees</h2>
            <p className="text-muted-foreground leading-relaxed">
              Payment processing is handled securely through Razorpay, our trusted payment gateway partner.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>All prices are displayed in Indian Rupees (₹)</li>
              <li>We support UPI, credit/debit cards, net banking, and wallets</li>
              <li>Currently, Acadly does not charge platform fees (subject to change)</li>
              <li>Payment gateway fees may apply as per Razorpay&apos;s terms</li>
              <li>Sellers receive payment after successful pickup confirmation</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">7. Pickup and Delivery</h2>
            <p className="text-muted-foreground leading-relaxed">
              Acadly primarily facilitates local, in-person transactions on or near campus.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>After payment, buyers receive a unique pickup code</li>
              <li>Sellers confirm delivery by entering the buyer&apos;s pickup code</li>
              <li>Meet in safe, public locations (preferably on campus)</li>
              <li>Inspect items before confirming pickup</li>
              <li>Shipping arrangements are at users&apos; own risk and discretion</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">8. Disputes and Refunds</h2>
            <p className="text-muted-foreground leading-relaxed">
              We encourage users to resolve issues directly. If that fails:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>File a dispute within 7 days of the transaction</li>
              <li>Provide evidence (photos, messages, etc.) to support your claim</li>
              <li>Our admin team will review and mediate disputes</li>
              <li>Refunds may be issued for items not as described or not delivered</li>
              <li>Decisions by our moderation team are final</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">9. User Conduct</h2>
            <p className="text-muted-foreground leading-relaxed">You agree to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Treat all users with respect and courtesy</li>
              <li>Communicate honestly and professionally</li>
              <li>Not engage in harassment, threats, or abusive behavior</li>
              <li>Not attempt to circumvent platform fees or safety features</li>
              <li>Not use automated tools or bots without permission</li>
              <li>Report violations and suspicious activity</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">10. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Acadly name, logo, and platform design are our intellectual property. 
              User-generated content (listings, reviews, messages) remains the property of the respective users, 
              but you grant us a license to display and use this content on our platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">11. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Acadly is provided &quot;as is&quot; without warranties of any kind. We are not liable for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>The quality, safety, or legality of items listed</li>
              <li>The accuracy of listings or user information</li>
              <li>User conduct or disputes between users</li>
              <li>Loss or damage arising from transactions</li>
              <li>Service interruptions or technical issues</li>
              <li>Third-party services (payment gateways, etc.)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">12. Account Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these terms, 
              engage in fraudulent activity, or harm the community. Users may also delete their 
              accounts at any time through their profile settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">13. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these terms from time to time. We will notify users of significant changes 
              via email or platform announcements. Continued use of Acadly after changes constitutes 
              acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">14. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms are governed by the laws of India. Any disputes shall be subject to the 
              exclusive jurisdiction of the courts in Kerala, India.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">15. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these terms, contact us at{" "}
              <a href="mailto:legal@acadly.in" className="text-primary hover:underline">legal@acadly.in</a>
            </p>
            <p className="text-muted-foreground leading-relaxed">
              For general support:{" "}
              <a href="mailto:support@acadly.in" className="text-primary hover:underline">support@acadly.in</a>
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  )
}
