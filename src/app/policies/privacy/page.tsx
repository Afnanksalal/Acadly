import { Card, CardContent } from "@/components/ui/card"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | Acadly",
  description: "Privacy Policy for Acadly - How we collect, use, and protect your data"
}

export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6">
      <Card>
        <CardContent className="p-6 sm:p-8 space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: January 2026</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              At Acadly, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
              disclose, and safeguard your information when you use our platform. Please read this policy 
              carefully. By using Acadly, you consent to the data practices described in this policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">2. Information We Collect</h2>
            
            <h3 className="text-lg font-medium mt-4">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>Account Information:</strong> Email address, name, username, password, college/university affiliation</li>
              <li><strong>Profile Information:</strong> Department, year of study, bio, profile picture, phone number (optional)</li>
              <li><strong>Listing Information:</strong> Product titles, descriptions, images, prices, categories</li>
              <li><strong>Transaction Information:</strong> Purchase history, payment details (processed by Razorpay)</li>
              <li><strong>Communications:</strong> Messages with other users, support requests, feedback</li>
              <li><strong>Verification Documents:</strong> College ID or email verification (when required)</li>
            </ul>

            <h3 className="text-lg font-medium mt-4">2.2 Information Collected Automatically</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform</li>
              <li><strong>Log Data:</strong> IP address, access times, referring URLs</li>
              <li><strong>Cookies:</strong> Session cookies, authentication tokens, preferences</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Create and manage your account</li>
              <li>Facilitate transactions between buyers and sellers</li>
              <li>Process payments through our payment partners</li>
              <li>Send transaction confirmations and pickup codes</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Send important updates about your account or transactions</li>
              <li>Verify user identity and prevent fraud</li>
              <li>Enforce our Terms of Service and community guidelines</li>
              <li>Improve our platform and develop new features</li>
              <li>Analyze usage patterns and optimize user experience</li>
              <li>Send promotional communications (with your consent)</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">4. Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may share your information in these circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>With Other Users:</strong> Your public profile, listings, and reviews are visible to other users. 
                When you engage in a transaction, relevant information is shared with the other party.</li>
              <li><strong>Service Providers:</strong> We work with trusted third parties who assist in operating our platform 
                (hosting, payment processing, analytics). These providers are bound by confidentiality agreements.</li>
              <li><strong>Payment Processing:</strong> Transaction data is shared with Razorpay for payment processing. 
                Their privacy policy governs their use of your data.</li>
              <li><strong>Legal Requirements:</strong> We may disclose information when required by law, court order, 
                or government request, or to protect our rights and safety.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, 
                user information may be transferred to the new entity.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Secure password hashing</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
              <li>Secure cloud infrastructure (Supabase, Vercel)</li>
              <li>Rate limiting and DDoS protection</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              However, no method of transmission over the Internet is 100% secure. We cannot guarantee 
              absolute security of your data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">6. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar technologies for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>Essential Cookies:</strong> Required for authentication and basic functionality</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You can control cookies through your browser settings. Disabling certain cookies may 
              affect platform functionality.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">7. Your Rights and Choices</h2>
            <p className="text-muted-foreground leading-relaxed">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from promotional communications</li>
              <li><strong>Restriction:</strong> Request limitation of data processing</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise these rights, contact us at{" "}
              <a href="mailto:privacy@acadly.in" className="text-primary hover:underline">privacy@acadly.in</a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">8. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your information for as long as your account is active or as needed to provide services. 
              After account deletion:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Profile data is deleted within 30 days</li>
              <li>Transaction records are retained for 7 years (legal/tax requirements)</li>
              <li>Anonymized analytics data may be retained indefinitely</li>
              <li>Backup data is purged within 90 days</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">9. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Acadly is intended for users 18 years and older. We do not knowingly collect information 
              from children under 18. If you believe we have collected information from a minor, 
              please contact us immediately at{" "}
              <a href="mailto:privacy@acadly.in" className="text-primary hover:underline">privacy@acadly.in</a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">10. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our platform integrates with third-party services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>Supabase:</strong> Database and authentication</li>
              <li><strong>Razorpay:</strong> Payment processing</li>
              <li><strong>Vercel:</strong> Hosting and deployment</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              These services have their own privacy policies. We encourage you to review them.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">11. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data may be processed on servers located outside India. We ensure appropriate 
              safeguards are in place for international data transfers in compliance with applicable laws.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">12. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant 
              changes via email or platform announcements. The &quot;Last updated&quot; date at the top 
              indicates when the policy was last revised.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">13. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy-related questions or concerns:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Email: <a href="mailto:privacy@acadly.in" className="text-primary hover:underline">privacy@acadly.in</a></li>
              <li>General Support: <a href="mailto:support@acadly.in" className="text-primary hover:underline">support@acadly.in</a></li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We will respond to your inquiry within 30 days.
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  )
}
