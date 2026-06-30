import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-background">
      <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h1>
      <p className="text-muted-foreground max-w-sm mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link href="/">
          <Button className="gap-2">
            <Home className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
        <Link href="/search">
          <Button variant="outline" className="gap-2">
            <Search className="h-4 w-4" /> Browse Venues
          </Button>
        </Link>
      </div>
    </div>
  );
}
