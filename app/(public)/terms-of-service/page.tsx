import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the terms and conditions governing your use of BookMyFarmhouse.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "July 1, 2025";
const CONTACT_EMAIL = "team@bookmyfarmhouse.app";

export default function TermsOfServicePage() {
  return (
    <div className="pt-20 pb-16 min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 text-sm">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using BookMyFarmhouse (&quot;the Platform&quot;, &quot;we&quot;, &quot;us&quot;), you agree to be bound by these Terms of Service and our{" "}
              <a href="/privacy-policy" className="text-orange-500 hover:underline">Privacy Policy</a>. If you do not agree, do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              BookMyFarmhouse is an online marketplace that connects customers looking for farmhouses and event venues with property owners (&quot;Vendors&quot;). We provide discovery, inquiry, and listing management tools. We do not own, operate, or inspect any of the listed properties, and we are not a party to any agreement between customers and vendors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 leading-relaxed">
              <li>You must be at least 18 years old to create a vendor account</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You must provide accurate, current, and complete information during registration</li>
              <li>You must notify us immediately of any unauthorised use of your account</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Vendor Obligations</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Vendors who list properties on BookMyFarmhouse agree to:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 leading-relaxed">
              <li>Provide accurate descriptions, photographs, pricing, and availability</li>
              <li>Respond to customer inquiries in a timely manner</li>
              <li>Ensure the property complies with all applicable local laws, fire safety codes, and licensing requirements</li>
              <li>Not list properties they do not own or have authority to let</li>
              <li>Not misrepresent amenities, capacity, or location</li>
              <li>Accept that listings are subject to admin review before being published</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Customer Inquiries</h2>
            <p className="text-muted-foreground leading-relaxed">
              Submitting an inquiry on BookMyFarmhouse is free and does not constitute a booking or reservation. Bookings, pricing agreements, and payment terms are arranged directly between the customer and the vendor. BookMyFarmhouse is not responsible for any disputes arising from those arrangements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Prohibited Conduct</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">You agree not to:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 leading-relaxed">
              <li>Post false, misleading, or defamatory content</li>
              <li>Scrape, crawl, or data-mine the Platform without our written permission</li>
              <li>Use the Platform for any unlawful purpose</li>
              <li>Attempt to gain unauthorised access to any part of the Platform</li>
              <li>Send spam or unsolicited commercial messages through the inquiry system</li>
              <li>Post content that infringes intellectual property rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content on the Platform — including text, design, logos, and software — is owned by or licensed to BookMyFarmhouse. Vendors retain ownership of their uploaded photos and listing content but grant BookMyFarmhouse a non-exclusive, royalty-free licence to display that content on the Platform and in marketing materials.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied. We do not warrant that the Platform will be uninterrupted, error-free, or free of viruses. We do not verify the accuracy of vendor-provided property descriptions or photographs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by applicable Indian law, BookMyFarmhouse shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of the Platform or any transaction between a customer and vendor. Our total liability to you shall not exceed ₹5,000 or the amount you paid to us in the preceding 12 months, whichever is greater.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify and hold harmless BookMyFarmhouse, its officers, employees, and partners from any claims, damages, or expenses (including reasonable legal fees) arising out of your use of the Platform, your listings, your violation of these Terms, or your infringement of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana, India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may modify these Terms at any time. We will update the &quot;Last updated&quot; date at the top of this page. Continued use of the Platform after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions about these Terms?{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-orange-500 hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
