import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import { connectDB } from "@/lib/db/mongoose";
import Blog from "@/lib/db/models/Blog.model";
import { JsonLd } from "@/components/common/JsonLd";

export const revalidate = 3600;

async function getBlog(slug: string) {
  await connectDB();
  return Blog.findOne({ slug, status: "published" }).lean();
}

async function getRelatedBlogs(slug: string, contentType: string) {
  await connectDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Blog.find({ status: "published" as any, slug: { $ne: slug }, contentType: contentType as any })
    .select("slug title featuredImage contentType publishedAt wordCount")
    .sort({ publishedAt: -1 })
    .limit(3)
    .lean();
}

export async function generateStaticParams() {
  await connectDB();
  const blogs = await Blog.find({ status: "published" }).select("slug").lean();
  return blogs.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog) return {};

  const base = process.env.SITE_URL ?? "https://bookmyfarmhouse.app";
  const url = `${base}/blog/${blog.slug}`;

  return {
    title: blog.metaTitle || blog.title,
    description: blog.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: blog.metaTitle || blog.title,
      description: blog.metaDescription,
      publishedTime: blog.publishedAt?.toISOString(),
      modifiedTime: (blog as { updatedAt?: Date }).updatedAt?.toISOString(),
      ...(blog.featuredImage?.url && { images: [{ url: blog.featuredImage.url, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: blog.metaTitle || blog.title,
      description: blog.metaDescription,
    },
  };
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  "location-page": "Location Guide",
  "comparison": "Comparison",
  "how-to": "How-To Guide",
  "faq-cluster": "FAQ",
  "geo-summary": "Overview",
};

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog) notFound();

  const base = process.env.SITE_URL ?? "https://bookmyfarmhouse.app";
  const url = `${base}/blog/${blog.slug}`;
  const readTime = Math.max(1, Math.ceil((blog.wordCount || 800) / 200));
  const related = await getRelatedBlogs(slug, blog.contentType);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.h1 || blog.title,
    description: blog.metaDescription,
    url,
    ...(blog.featuredImage?.url && { image: blog.featuredImage.url }),
    datePublished: blog.publishedAt?.toISOString(),
    dateModified: (blog as { updatedAt?: Date }).updatedAt?.toISOString(),
    author: { "@type": "Organization", name: "BookMyFarmhouse", url: base },
    publisher: { "@type": "Organization", name: "BookMyFarmhouse", url: base },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${base}/blog` },
      { "@type": "ListItem", position: 3, name: blog.title, item: url },
    ],
  };

  const faqSchema = blog.faqSchema?.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: blog.faqSchema.map((f: { question: string; answer: string }) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }
    : null;

  return (
    <>
      <JsonLd schema={articleSchema} />
      <JsonLd schema={breadcrumbSchema} />
      {faqSchema && <JsonLd schema={faqSchema} />}

      {/* Hero */}
      <div className="relative w-full bg-gray-900" style={{ minHeight: blog.featuredImage?.url ? 420 : 200 }}>
        {blog.featuredImage?.url ? (
          <>
            <Image
              src={blog.featuredImage.url}
              alt={blog.title}
              fill
              className="object-cover opacity-60"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-orange-500/10 to-transparent" />
        )}
        <div className="relative max-w-3xl mx-auto px-4 pt-12 pb-10 flex flex-col justify-end h-full">
          <nav className="text-xs text-white/60 flex items-center gap-1.5 mb-5">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <span>/</span>
            <a href="/blog" className="hover:text-white transition-colors">Blog</a>
            <span>/</span>
            <span className="text-white/80 truncate max-w-xs">{blog.title}</span>
          </nav>
          {blog.contentType && (
            <span className="inline-flex self-start items-center bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
              {CONTENT_TYPE_LABELS[blog.contentType] ?? blog.contentType}
            </span>
          )}
          <h1 className="text-2xl sm:text-4xl font-bold text-white leading-tight mb-4" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
            {blog.h1 || blog.title}
          </h1>
          <div className="flex items-center gap-4 text-white/60 text-sm">
            {blog.publishedAt && (
              <time dateTime={blog.publishedAt.toISOString()}>
                {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(blog.publishedAt))}
              </time>
            )}
            <span>·</span>
            <span>{readTime} min read</span>
            <span>·</span>
            <span>BookMyFarmhouse</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* GEO quick-answer box — strip any HTML tags the AI may have included */}
        {blog.geoAnswerBlock && (
          <div className="rounded-2xl bg-orange-50 border border-orange-200 p-5 mb-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-400 rounded-l-2xl" />
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2 pl-3">Quick Summary</p>
            <p className="text-sm leading-relaxed text-gray-700 pl-3">
              {blog.geoAnswerBlock.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}
            </p>
          </div>
        )}

        {/* Body */}
        <article
          className="
            prose prose-base max-w-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-5
            prose-li:text-gray-700 prose-li:leading-relaxed
            prose-strong:text-gray-900
            prose-a:text-orange-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
            prose-ul:my-5 prose-ol:my-5
            prose-img:rounded-2xl prose-img:shadow-md
          "
          dangerouslySetInnerHTML={{ __html: blog.bodyHtml || "" }}
        />

        {/* FAQ */}
        {blog.faqSchema?.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-7 bg-orange-500 rounded-full" />
              <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-3">
              {blog.faqSchema.map((faq: { question: string; answer: string }, i: number) => (
                <details key={i} className="group rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-gray-900 text-sm list-none select-none hover:bg-gray-50 transition-colors">
                    {faq.question}
                    <span className="ml-4 shrink-0 text-gray-400 group-open:rotate-180 transition-transform duration-200">▾</span>
                  </summary>
                  <div className="px-5 pb-4 pt-1 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mt-14 rounded-2xl overflow-hidden relative bg-gray-900 text-white px-8 py-10 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/30 to-transparent pointer-events-none" />
          <div className="relative">
            <span className="inline-block bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
              Find Your Venue
            </span>
            <h3 className="text-2xl font-bold mb-3">Book the Perfect Farmhouse Today</h3>
            <p className="text-white/70 text-sm mb-6 max-w-sm mx-auto">
              Explore verified farmhouses, private villas, and event venues across Hyderabad & Telangana.
            </p>
            <a
              href="/search"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-7 py-3 font-semibold transition-colors text-sm shadow-lg shadow-orange-500/30"
            >
              Browse Farmhouses →
            </a>
          </div>
        </section>

        {/* Related articles */}
        {related.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-7 bg-orange-500 rounded-full" />
              <h2 className="text-xl font-bold text-gray-900">More Articles</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <a key={r.slug} href={`/blog/${r.slug}`} className="group block rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow bg-white">
                  {r.featuredImage?.url ? (
                    <div className="relative h-36 bg-gray-100">
                      <Image src={r.featuredImage.url} alt={r.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="33vw" />
                    </div>
                  ) : (
                    <div className="h-36 bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                      <span className="text-3xl">🏡</span>
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-xs text-orange-600 font-semibold mb-1">{CONTENT_TYPE_LABELS[r.contentType] ?? r.contentType}</p>
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">{r.title}</h3>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
