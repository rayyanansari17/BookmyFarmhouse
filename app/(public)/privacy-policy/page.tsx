import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how BookMyFarmhouse collects, uses, and protects your personal information.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "July 1, 2025";
const CONTACT_EMAIL = "team@bookmyfarmhouse.app";

export default function PrivacyPolicyPage() {
  return (
    <div className="pt-20 pb-16 min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-sm max-w-none text-foreground space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Who We Are</h2>
            <p className="text-muted-foreground leading-relaxed">
              BookMyFarmhouse (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the website{" "}
              <a href="https://bookmyfarmhouse.app" className="text-orange-500 hover:underline">
                bookmyfarmhouse.app
              </a>{" "}
              — a marketplace connecting customers with farmhouse and event venue vendors across India.
              Our registered contact email is{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-orange-500 hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Information you provide directly</h3>
                <ul className="list-disc pl-5 text-muted-foreground space-y-1 leading-relaxed">
                  <li>Name, phone number, and email address when you submit an inquiry</li>
                  <li>Business name, property details, and bank information when you register as a vendor</li>
                  <li>Login credentials (email/password) for vendor and admin accounts</li>
                  <li>Property images uploaded via our listing management tools</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-1">Information collected automatically</h3>
                <ul className="list-disc pl-5 text-muted-foreground space-y-1 leading-relaxed">
                  <li>Browser type, device type, and operating system</li>
                  <li>Pages visited, time spent, and click patterns (via Google Analytics)</li>
                  <li>IP address and approximate geographic location</li>
                  <li>Session tokens stored in HTTP-only cookies for authentication</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 leading-relaxed">
              <li>To connect customer inquiries with the relevant farmhouse vendor</li>
              <li>To provide, maintain, and improve our platform</li>
              <li>To send transactional emails (inquiry notifications, account actions)</li>
              <li>To analyse usage patterns and improve user experience</li>
              <li>To detect and prevent fraud or misuse</li>
              <li>To comply with applicable Indian laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We do not sell your personal data. We share data only in these circumstances:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 leading-relaxed">
              <li>
                <strong className="text-foreground">Vendors:</strong> When you submit an inquiry, your name, phone, and message are shared with the venue vendor.
              </li>
              <li>
                <strong className="text-foreground">Cloudinary:</strong> Property images are stored and served via Cloudinary (USA). They process images under their own privacy policy.
              </li>
              <li>
                <strong className="text-foreground">Google Analytics:</strong> Anonymised usage data is sent to Google for analytics purposes. You can opt out via Google&apos;s opt-out browser add-on.
              </li>
              <li>
                <strong className="text-foreground">Legal requirements:</strong> We may disclose data if required by law, court order, or government authority in India.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies for authentication (HTTP-only, not accessible to JavaScript) and analytics. See our{" "}
              <Link href="/cookie-policy" className="text-orange-500 hover:underline">
                Cookie Policy
              </Link>{" "}
              for details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 leading-relaxed">
              <li>Inquiry data is retained for 2 years or until deletion is requested</li>
              <li>Vendor account data is retained for the lifetime of the account plus 1 year after closure</li>
              <li>Authentication tokens expire within 7 days and are purged automatically</li>
              <li>Analytics data is retained per Google Analytics&apos; standard retention settings (14 months by default)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Under the Digital Personal Data Protection Act 2023 (India) and applicable laws, you have the right to:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 leading-relaxed">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your data (subject to legal retention requirements)</li>
              <li>Withdraw consent for data processing at any time</li>
              <li>Lodge a complaint with the Data Protection Board of India</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              To exercise any of these rights, email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-orange-500 hover:underline">
                {CONTACT_EMAIL}
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use industry-standard measures including HTTPS encryption, HTTP-only secure cookies, hashed passwords (bcrypt), and access-controlled APIs. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our platform is not directed at children under 18. We do not knowingly collect personal data from minors. If you believe a child has provided us data, contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-orange-500 hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this policy from time to time. We will post the updated version on this page with a revised &quot;Last updated&quot; date. Continued use of the platform after changes constitutes acceptance of the new policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy-related questions or data requests, contact us at:
            </p>
            <address className="not-italic mt-3 text-muted-foreground">
              <strong className="text-foreground">BookMyFarmhouse</strong><br />
              Beside NMDC — Vijaya Nagar Colony Road<br />
              Masab Tank, Hyderabad, Telangana 500006<br />
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-orange-500 hover:underline">
                {CONTACT_EMAIL}
              </a>
            </address>
          </section>
        </div>
      </div>
    </div>
  );
}
