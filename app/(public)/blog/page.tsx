import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connectDB } from "@/lib/db/mongoose";
import Blog from "@/lib/db/models/Blog.model";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog — Farmhouse Tips, Venue Guides & Local Insights | BookMyFarmhouse",
  description: "Expert guides to finding the best farmhouses, event venues, and weekend getaways across Hyderabad & Telangana. Tips for parties, weddings, and team outings.",
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

const CONTENT_TYPE_COLORS: Record<string, string> = {
  "location-page": "bg-blue-100 text-blue-700",
  "comparison": "bg-purple-100 text-purple-700",
  "how-to": "bg-green-100 text-green-700",
  "faq-cluster": "bg-yellow-100 text-yellow-700",
  "geo-summary": "bg-orange-100 text-orange-700",
};

async function getPublishedBlogs() {
  await connectDB();
  return Blog.find({ status: "published" })
    .select("slug title metaDescription targetKeyword contentType publishedAt wordCount featuredImage")
    .sort({ publishedAt: -1 })
    .limit(50)
    .lean();
}

export default async function BlogIndexPage() {
  const blogs = await getPublishedBlogs();
  const [featured, ...rest] = blogs;

  return (
    <main>
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-100 px-4 py-14 text-center">
        <span className="inline-block bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
          BMF Blog
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Farmhouse & Venue Guides
        </h1>
        <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed">
          Expert guides on finding the perfect farmhouse for birthday parties, corporate events, weddings, and weekend getaways across Hyderabad & Telangana.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {blogs.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl mb-4 block">🏡</span>
            <p className="text-gray-500">No blogs published yet. Check back soon.</p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            {featured && (
              <Link href={`/blog/${featured.slug}`} className="group block mb-12 rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow bg-white">
                <div className="sm:flex">
                  <div className="relative sm:w-1/2 h-56 sm:h-auto bg-gray-100 shrink-0">
                    {featured.featuredImage?.url ? (
                      <Image
                        src={featured.featuredImage.url}
                        alt={featured.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, 50vw"
                        priority
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                        <span className="text-6xl">🌿</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">Featured</span>
                    </div>
                  </div>
                  <div className="p-7 sm:p-10 flex flex-col justify-center">
                    <span className={`self-start text-xs font-semibold px-3 py-1 rounded-full mb-4 ${CONTENT_TYPE_COLORS[featured.contentType] ?? "bg-gray-100 text-gray-600"}`}>
                      {CONTENT_TYPE_LABELS[featured.contentType] ?? featured.contentType}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors mb-3 leading-snug">
                      {featured.title}
                    </h2>
                    {featured.metaDescription && (
                      <p className="text-sm text-gray-500 line-clamp-3 mb-5 leading-relaxed">{featured.metaDescription}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {featured.publishedAt && (
                        <time dateTime={new Date(featured.publishedAt).toISOString()}>
                          {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(featured.publishedAt))}
                        </time>
                      )}
                      {featured.wordCount > 0 && <span>{Math.ceil(featured.wordCount / 200)} min read</span>}
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            {rest.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((blog) => (
                  <Link
                    key={blog.slug}
                    href={`/blog/${blog.slug}`}
                    className="group flex flex-col rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow bg-white"
                  >
                    <div className="relative h-48 bg-gray-100 shrink-0">
                      {blog.featuredImage?.url ? (
                        <Image
                          src={blog.featuredImage.url}
                          alt={blog.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                          <span className="text-4xl">🏡</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${CONTENT_TYPE_COLORS[blog.contentType] ?? "bg-gray-100 text-gray-600"}`}>
                        {CONTENT_TYPE_LABELS[blog.contentType] ?? blog.contentType}
                      </span>
                      <h2 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 mb-2 text-[15px] leading-snug flex-1">
                        {blog.title}
                      </h2>
                      {blog.metaDescription && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">{blog.metaDescription}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-3 border-t border-gray-100">
                        {blog.publishedAt && (
                          <time dateTime={new Date(blog.publishedAt).toISOString()}>
                            {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(blog.publishedAt))}
                          </time>
                        )}
                        {blog.wordCount > 0 && <span>{Math.ceil(blog.wordCount / 200)} min read</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
