import { Metadata } from "next";
import Link from "next/link";
import { connectDB } from "@/lib/db/mongoose";
import Blog from "@/lib/db/models/Blog.model";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog — Farmhouse Tips, Venue Guides & Local Insights",
  description: "Expert guides to finding the best farmhouses, event venues, and weekend getaways across India. Tips for parties, weddings, and team outings.",
  alternates: {
    canonical: `${process.env.SITE_URL ?? "https://bookmyfarmhouse.app"}/blog`,
  },
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  "location-page": "Location Guide",
  "comparison": "Comparison",
  "how-to": "How-To",
  "faq-cluster": "FAQ",
  "geo-summary": "Overview",
};

async function getPublishedBlogs() {
  await connectDB();
  return Blog.find({ status: "published" })
    .select("slug title metaDescription targetKeyword contentType publishedAt wordCount")
    .sort({ publishedAt: -1 })
    .limit(50)
    .lean();
}

export default async function BlogIndexPage() {
  const blogs = await getPublishedBlogs();

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-foreground mb-3">BMF Blog</h1>
        <p className="text-muted-foreground max-w-xl">
          Expert guides on finding the perfect farmhouse, event venue, and weekend getaway across India.
        </p>
      </header>

      {blogs.length === 0 ? (
        <p className="text-muted-foreground">No blogs published yet. Check back soon.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {blogs.map((blog) => (
            <Link
              key={blog.slug}
              href={`/blog/${blog.slug}`}
              className="group block rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {CONTENT_TYPE_LABELS[blog.contentType] ?? blog.contentType}
                </span>
                {blog.publishedAt && (
                  <time className="text-xs text-muted-foreground" dateTime={new Date(blog.publishedAt).toISOString()}>
                    {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(blog.publishedAt))}
                  </time>
                )}
              </div>
              <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                {blog.title}
              </h2>
              {blog.metaDescription && (
                <p className="text-sm text-muted-foreground line-clamp-2">{blog.metaDescription}</p>
              )}
              {blog.wordCount > 0 && (
                <p className="text-xs text-muted-foreground mt-3">{Math.ceil(blog.wordCount / 200)} min read</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
