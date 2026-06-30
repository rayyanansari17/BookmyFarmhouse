"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  Plus,
  MessageSquare,
  User,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/vendor", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/vendor/listings", label: "My Listings", icon: Building2 },
  { href: "/vendor/listings/new", label: "Add Listing", icon: Plus },
  { href: "/vendor/leads", label: "Leads", icon: MessageSquare },
  { href: "/vendor/profile", label: "Profile", icon: User },
];

function NavItem({
  href,
  label,
  icon: Icon,
  exact,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
      {active && <ChevronRight className="h-3 w-3 ml-auto" />}
    </Link>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 py-4 mb-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-sm">BF</span>
        </div>
        <div>
          <div className="font-bold text-sm text-foreground">BookMyFarmhouse</div>
          <div className="text-xs text-muted-foreground">Vendor Portal</div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="ml-auto" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator className="mb-4" />

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} onClick={onClose} />
        ))}
      </nav>

      <Separator className="mt-4 mb-3" />

      {/* User card */}
      {session && (
        <div className="px-3 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={session.user.profileImage} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {session.user.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{session.user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-muted-foreground hover:text-destructive hover:border-destructive"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      )}
    </div>
  );
}

export function VendorShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  const currentItem = NAV_ITEMS.find((i) =>
    i.exact ? pathname === i.href : pathname.startsWith(i.href)
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border shadow-xl">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-sm text-foreground">{currentItem?.label ?? "Dashboard"}</h1>
          <div className="ml-auto">
            <Avatar className="h-7 w-7">
              <AvatarImage src={session?.user.profileImage} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {session?.user.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
