import Link from "next/link";
import { HomeIcon, Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center">
                <HomeIcon size={18} className="text-white" />
              </div>
              <span className="font-black text-lg">
                BookMy<span className="text-orange-400">Farmhouse</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              India&apos;s structured farmhouse discovery platform. Find, inquire, and secure the perfect venue for your event.
            </p>
            <div className="flex gap-3">
              {[
                { label: "X", href: "https://x.com/bookfarmhouse" },
                { label: "in", href: "https://www.linkedin.com/company/bookmyfarmhouse/" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-orange-600 flex items-center justify-center transition-colors text-xs font-bold"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                ["Browse Listings", "/search"],
                ["Become a Vendor", "/become-vendor"],
                ["How It Works", "/#how-it-works"],
                ["Why Choose Us", "/#why-us"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-gray-400 hover:text-orange-400 text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Cities */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Popular Cities</h4>
            <ul className="space-y-2.5">
              {[
                ["Hyderabad", "hyderabad"],
                ["Bangalore", "bangalore"],
                ["Mumbai", "mumbai"],
                ["Delhi", "delhi"],
                ["Chennai", "chennai"],
                ["Pune", "pune"],
                ["Jaipur", "jaipur"],
                ["Gurugram", "gurugram"],
              ].map(([label, slug]) => (
                <li key={slug}>
                  <Link href={`/farmhouses-in-${slug}`} className="text-gray-400 hover:text-orange-400 text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Vendors */}
          <div>
            <h4 className="font-semibold mb-4 text-white">For Vendors</h4>
            <ul className="space-y-2.5">
              {[
                ["Vendor Login", "/vendor/login"],
                ["Register Farmhouse", "/become-vendor"],
                ["Manage Listings", "/vendor/listings"],
                ["View Leads", "/vendor/leads"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-gray-400 hover:text-orange-400 text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone size={15} className="text-orange-400 mt-0.5 shrink-0" />
                <a href="tel:+919573109741" className="text-gray-400 text-sm hover:text-orange-400 transition-colors">
                  +91 9573109741
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={15} className="text-orange-400 mt-0.5 shrink-0" />
                <a href="mailto:team@bookmyfarmhouse.app" className="text-gray-400 text-sm hover:text-orange-400 transition-colors">
                  team@bookmyfarmhouse.app
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-orange-400 mt-0.5 shrink-0" />
                <span className="text-gray-400 text-sm">
                  Beside NMDC - Vijaya Nagar Colony Road, Masab Tank, Hyderabad, Telangana 500006
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">© 2025 BookMyFarmhouse. All rights reserved.</p>
          <div className="flex gap-6">
            {[
              ["Privacy Policy", "/privacy-policy"],
              ["Terms of Service", "/terms-of-service"],
              ["Cookie Policy", "/cookie-policy"],
            ].map(([label, href]) => (
              <Link key={label} href={href} className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
