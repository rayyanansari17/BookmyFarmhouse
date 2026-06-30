import Link from "next/link";
import { Globe, MessageCircle, Rss, Users, Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">BF</span>
              </div>
              <span className="font-bold text-lg text-foreground">BookMyFarmhouse</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              India&apos;s trusted marketplace for premium farmhouses and event venues. Making every
              celebration extraordinary.
            </p>
            <div className="flex gap-3">
              {[
                { icon: MessageCircle, href: "#" },
                { icon: Globe, href: "#" },
                { icon: Users, href: "#" },
                { icon: Rss, href: "#" },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { href: "/search", label: "Browse Venues" },
                { href: "/become-vendor", label: "Become a Vendor" },
                { href: "/vendor/login", label: "Vendor Login" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Vendors */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">For Vendors</h3>
            <ul className="space-y-2">
              {[
                { href: "/vendor/register", label: "Register Your Property" },
                { href: "/vendor", label: "Vendor Dashboard" },
                { href: "/vendor/listings", label: "Manage Listings" },
                { href: "/vendor/leads", label: "View Leads" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">+91 98765 43210</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">hello@bookmyfarmhouse.app</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">Mumbai, Maharashtra, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} BookMyFarmhouse. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
