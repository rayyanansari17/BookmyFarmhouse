"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Menu, X, Search, Sun, Moon, LayoutDashboard, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">BF</span>
            </div>
            <span
              className={cn(
                "font-bold text-lg transition-colors",
                scrolled ? "text-foreground" : "text-white"
              )}
            >
              BookMyFarmhouse
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/search"
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-primary",
                scrolled ? "text-foreground" : "text-white/90"
              )}
            >
              Browse Venues
            </Link>
            <Link
              href="/become-vendor"
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-primary",
                scrolled ? "text-foreground" : "text-white/90"
              )}
            >
              List Your Property
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Search icon */}
            <Link href="/search">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full transition-colors",
                  !scrolled && "text-white hover:text-white hover:bg-white/20"
                )}
              >
                <Search className="h-4 w-4" />
              </Button>
            </Link>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full",
                !scrolled && "text-white hover:text-white hover:bg-white/20"
              )}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Auth area */}
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.profileImage} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {session.user.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/vendor")}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/vendor/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      !scrolled && "text-white hover:text-white hover:bg-white/20"
                    )}
                  >
                    Vendor Login
                  </Button>
                </Link>
                <Link href="/vendor/register">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    List Property
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "md:hidden rounded-full",
                !scrolled && "text-white hover:text-white hover:bg-white/20"
              )}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 py-3 space-y-1">
          <Link
            href="/search"
            className="block px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-accent"
            onClick={() => setMenuOpen(false)}
          >
            Browse Venues
          </Link>
          <Link
            href="/become-vendor"
            className="block px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-accent"
            onClick={() => setMenuOpen(false)}
          >
            List Your Property
          </Link>
          {!session && (
            <>
              <Link
                href="/vendor/login"
                className="block px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-accent"
                onClick={() => setMenuOpen(false)}
              >
                Vendor Login
              </Link>
              <Link href="/vendor/register" onClick={() => setMenuOpen(false)}>
                <Button size="sm" className="w-full mt-1">
                  List Property
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
