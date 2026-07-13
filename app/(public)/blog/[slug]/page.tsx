import { notFound } from "next/navigation";
import { Metadata } from "next";
import { connectDB } from "@/lib/db/mongoose";
import Blog from "@/lib/db/models/Blog.model";
import { JsonLd } from "@/components/common/JsonLd";

export const revalidate = 3600;

async function getBlog(slug: string) {
  await connectDB();
  return Blog.findOne({ slug, status: "published" }).lean();
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
    },
    twitter: {
      card: "summary_large_image",
      title: blog.metaTitle || blog.title,
      description: blog.metaDescription,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog) notFound();

  const base = process.env.SITE_URL ?? "https://bookmyfarmhouse.app";
  const url = `${base}/blog/${blog.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.h1 || blog.title,
    description: blog.metaDescription,
    url,
    datePublished: blog.publishedAt?.toISOString(),
    dateModified: (blog as { updatedAt?: Date }).updatedAt?.toISOString(),
    author: {
      "@type": "Organization",
      name: "BookMyFarmhouse",
      url: base,
    },
    publisher: {
      "@type": "Organization",
      name: "BookMyFarmhouse",
      url: base,
    },
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

      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
          <a href="/" className="hover:text-foreground">Home</a>
          <span>/</span>
          <a href="/blog" className="hover:text-foreground">Blog</a>
          <span>/</span>
          <span className="text-foreground truncate max-w-xs">{blog.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-4">
            {blog.h1 || blog.title}
          </h1>
          {blog.publishedAt && (
            <time
              dateTime={blog.publishedAt.toISOString()}
              className="text-sm text-muted-foreground"
            >
              {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(blog.publishedAt))}
            </time>
          )}
        </header>

        {/* GEO answer block (hidden visually, visible to AI engines) */}
        {blog.geoAnswerBlock && (
          <div
            className="bg-muted/40 rounded-xl p-5 mb-8 text-sm leading-relaxed text-foreground border border-border/60"
            aria-label="Summary"
          >
            {blog.geoAnswerBlock}
          </div>
        )}

        {/* Body */}
        <article
          className="prose prose-sm sm:prose max-w-none prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: blog.bodyHtml || "" }}
        />

        {/* FAQ section */}
        {blog.faqSchema?.length > 0 && (
          <section className="mt-10 border-t border-border pt-8">
            <h2 className="text-xl font-bold text-foreground mb-5">Frequently Asked Questions</h2>
            <div className="space-y-5">
              {blog.faqSchema.map((faq: { question: string; answer: string }, i: number) => (
                <div key={i}>
                  <h3 className="font-semibold text-foreground mb-1.5">{faq.question}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mt-12 bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
          <h3 className="font-bold text-lg text-foreground mb-2">Find & Book Farmhouses Instantly</h3>
          <p className="text-sm text-muted-foreground mb-4">Browse hundreds of verified farmhouses and event venues across India.</p>
          <a
            href="/search"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Browse Farmhouses
          </a>
        </section>
      </main>
    </>
  );
}
