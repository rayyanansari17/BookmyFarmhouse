"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X } from "lucide-react";
import Image from "next/image";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll(); // read immediately on mount (handles hard refresh with restored scroll)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Re-read scroll on every route change — scrolled state persists across
  // client-side navigation, so navigating back to "/" from a scrolled page
  // would keep the navbar white even though the page is at the top.
  useEffect(() => {
    setScrolled(window.scrollY > 20);
  }, [pathname]);

  useEffect(() => setMenuOpen(false), [pathname]);

  const transparent = isHome && !scrolled;

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          transparent
            ? "bg-transparent"
            : "bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src={transparent ? "/logo-light.png" : "/logo-dark.png"}
                alt="BookMyFarmhouse"
                width={160}
                height={40}
                className="h-10 w-auto group-hover:scale-105 transition-transform"
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink href="/search" transparent={transparent}>Listings</NavLink>
              <NavLink href="/become-vendor" transparent={transparent}>Become a Vendor</NavLink>
              <div className="w-px h-4 bg-gray-300 mx-2" />
              <Link
                href="/vendor/login"
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  transparent
                    ? "text-white/70 hover:text-white hover:bg-white/10"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Vendor Login
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/search")}
                className={`p-2.5 rounded-xl transition-colors ${
                  transparent
                    ? "text-white hover:bg-white/10"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Search size={18} />
              </button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`md:hidden p-2.5 rounded-xl transition-colors ${
                  transparent
                    ? "text-white hover:bg-white/10"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-lg md:hidden overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              <MobileNavLink href="/search">Browse Listings</MobileNavLink>
              <MobileNavLink href="/become-vendor">Become a Vendor</MobileNavLink>
              <hr className="my-2 border-gray-100" />
              <MobileNavLink href="/vendor/login">Vendor Login</MobileNavLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({ href, children, transparent }: { href: string; children: React.ReactNode; transparent: boolean }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
        transparent
          ? "text-white/80 hover:text-white hover:bg-white/10"
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-colors">
      {children}
    </Link>
  );
}
