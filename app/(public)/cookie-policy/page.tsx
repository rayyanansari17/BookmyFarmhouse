import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Understand how BookMyFarmhouse uses cookies and similar tracking technologies.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "July 1, 2025";
const CONTACT_EMAIL = "team@bookmyfarmhouse.app";

interface CookieRow {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
}

const COOKIES: CookieRow[] = [
  {
    name: "next-auth.session-token",
    provider: "BookMyFarmhouse",
    purpose: "Authentication — keeps you logged in to your vendor or admin account",
    duration: "7 days",
  },
  {
    name: "next-auth.csrf-token",
    provider: "BookMyFarmhouse",
    purpose: "CSRF protection for authentication forms",
    duration: "Session",
  },
  {
    name: "_ga, _gid",
    provider: "Google Analytics",
    purpose: "Distinguishes users and sessions for usage analytics",
    duration: "2 years / 24 hours",
  },
  {
    name: "_ga_*",
    provider: "Google Analytics",
    purpose: "Maintains Google Analytics session state",
    duration: "2 years",
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="pt-20 pb-16 min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Cookie Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 text-sm">
          <section>
            <h2 className="text-xl font-semibold mb-3">What Are Cookies?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work efficiently, remember your preferences, and provide information to website owners.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">How We Use Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              BookMyFarmhouse uses cookies for two purposes: <strong className="text-foreground">authentication</strong> and <strong className="text-foreground">analytics</strong>. We do not use advertising cookies or sell cookie data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Cookies We Set</h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Cookie</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Provider</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Purpose</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {COOKIES.map((c, i) => (
                    <tr key={c.name} className={i < COOKIES.length - 1 ? "border-b border-border" : ""}>
                      <td className="px-4 py-3 font-mono text-foreground whitespace-nowrap">{c.name}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.provider}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.purpose}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Authentication Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              These are <strong className="text-foreground">strictly necessary</strong> cookies. They are HTTP-only (inaccessible to JavaScript) and secure (HTTPS only). Without them, the vendor and admin portals cannot function. You cannot opt out of these cookies while using those parts of the site; however, if you only browse public listings, no authentication cookies are set.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Analytics Cookies (Google Analytics)</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We use Google Analytics to understand how visitors interact with our site — which pages are most visited, how long sessions last, and where traffic originates. The data is aggregated and anonymised; we do not use it to identify individual users.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You can opt out of Google Analytics tracking at any time by installing the{" "}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:underline"
              >
                Google Analytics Opt-out Browser Add-on
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Managing Cookies in Your Browser</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Most browsers allow you to control cookies through their settings. You can typically:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 leading-relaxed">
              <li>View cookies currently stored on your device</li>
              <li>Block some or all cookies</li>
              <li>Delete cookies when you close your browser</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Note that blocking all cookies will prevent vendor and admin account login from working. Public browsing of listings does not require cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Updates to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Cookie Policy when we add or change cookies. The &quot;Last updated&quot; date at the top reflects the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions about our use of cookies?{" "}
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
