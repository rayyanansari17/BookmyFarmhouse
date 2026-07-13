"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Globe, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Blog {
  _id: string;
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  bodyHtml: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  contentType: string;
  status: string;
  seoScore: number;
  wordCount: number;
  keywordDensity: number;
  readabilityScore: number;
  faqSchema: { question: string; answer: string }[];
  geoAnswerBlock: string;
  publishedAt?: string;
  generatedBy?: string;
}

const STATUS_OPTIONS = [
  "keyword_identified", "brief_generated", "content_generated",
  "pending_review", "approved", "scheduled", "published", "active_monitoring",
];

export default function BlogEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "meta" | "faq" | "preview">("content");

  const fetchBlog = useCallback(async () => {
    const res = await fetch(`/api/admin/blog/${id}`);
    const data = await res.json();
    if (data.success) setBlog(data.data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchBlog(); }, [fetchBlog]);

  const save = async () => {
    if (!blog) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: blog.title,
          metaTitle: blog.metaTitle,
          metaDescription: blog.metaDescription,
          h1: blog.h1,
          bodyHtml: blog.bodyHtml,
          targetKeyword: blog.targetKeyword,
          secondaryKeywords: blog.secondaryKeywords,
          contentType: blog.contentType,
          status: blog.status,
          faqSchema: blog.faqSchema,
          geoAnswerBlock: blog.geoAnswerBlock,
        }),
      });
      const data = await res.json();
      if (data.success) { setBlog(data.data); toast.success("Saved"); }
      else throw new Error(data.error);
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/admin/blog/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (data.success) { setBlog(data.data); toast.success("Published!"); }
      else throw new Error(data.error);
    } catch {
      toast.error("Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const regenerate = async () => {
    if (!confirm("Regenerate content? This will overwrite the current body.")) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/admin/blog/${id}/generate`, { method: "POST" });
      const data = await res.json();
      if (data.success) { setBlog(data.data); toast.success("Regenerated!"); }
      else throw new Error(data.error);
    } catch {
      toast.error("Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return (
    <div className="space-y-4 max-w-4xl">
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
    </div>
  );

  if (!blog) return <div className="text-muted-foreground">Blog not found.</div>;

  const seoScoreColor = blog.seoScore >= 70 ? "text-green-600" : blog.seoScore >= 40 ? "text-yellow-600" : "text-red-500";

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/blog")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold truncate max-w-md">{blog.title || blog.targetKeyword}</h1>
            <p className="text-xs text-muted-foreground">/blog/{blog.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {blog.status !== "published" && (
            <Button variant="outline" size="sm" onClick={regenerate} disabled={generating}>
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
              Regenerate
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Save
          </Button>
          {blog.status !== "published" ? (
            <Button size="sm" onClick={publish} disabled={publishing}>
              {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5 mr-1.5" />}
              Publish
            </Button>
          ) : (
            <a href={`/blog/${blog.slug}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View Live
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* SEO score bar */}
      <Card>
        <CardContent className="py-3 px-4 flex items-center gap-6 flex-wrap">
          <div>
            <span className="text-xs text-muted-foreground">SEO Score</span>
            <p className={`text-2xl font-bold ${seoScoreColor}`}>{blog.seoScore}<span className="text-sm text-muted-foreground">/100</span></p>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div>
            <span className="text-xs text-muted-foreground">Words</span>
            <p className="font-semibold text-sm">{blog.wordCount.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Keyword density</span>
            <p className={`font-semibold text-sm ${blog.keywordDensity >= 1 && blog.keywordDensity <= 3 ? "text-green-600" : "text-yellow-600"}`}>
              {blog.keywordDensity}%
            </p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Status</span>
            <div className="mt-0.5">
              <Select value={blog.status} onValueChange={(v) => setBlog((b) => b && v ? { ...b, status: v } : b)}>
                <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {blog.generatedBy && (
            <Badge variant="outline" className="text-xs ml-auto">{blog.generatedBy}</Badge>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["content", "meta", "faq", "preview"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "content" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Target Keyword</Label>
              <Input value={blog.targetKeyword} onChange={(e) => setBlog((b) => b ? { ...b, targetKeyword: e.target.value } : b)} />
            </div>
            <div className="space-y-1.5">
              <Label>H1</Label>
              <Input value={blog.h1} onChange={(e) => setBlog((b) => b ? { ...b, h1: e.target.value } : b)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={blog.title} onChange={(e) => setBlog((b) => b ? { ...b, title: e.target.value } : b)} />
          </div>
          <div className="space-y-1.5">
            <Label>Body HTML</Label>
            <Textarea
              value={blog.bodyHtml}
              onChange={(e) => setBlog((b) => b ? { ...b, bodyHtml: e.target.value } : b)}
              className="font-mono text-xs min-h-[400px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>GEO Answer Block</Label>
            <Textarea
              value={blog.geoAnswerBlock}
              onChange={(e) => setBlog((b) => b ? { ...b, geoAnswerBlock: e.target.value } : b)}
              placeholder="2-3 paragraph direct answer for AI engines (Perplexity, ChatGPT, Gemini)"
              className="min-h-[120px]"
            />
          </div>
        </div>
      )}

      {activeTab === "meta" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Meta Title <span className="text-xs text-muted-foreground">({blog.metaTitle.length}/60)</span></Label>
            <Input
              value={blog.metaTitle}
              onChange={(e) => setBlog((b) => b ? { ...b, metaTitle: e.target.value } : b)}
              className={blog.metaTitle.length > 60 ? "border-destructive" : ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Meta Description <span className="text-xs text-muted-foreground">({blog.metaDescription.length}/160)</span></Label>
            <Textarea
              value={blog.metaDescription}
              onChange={(e) => setBlog((b) => b ? { ...b, metaDescription: e.target.value } : b)}
              className={blog.metaDescription.length > 160 ? "border-destructive" : ""}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input value={blog.slug} disabled className="font-mono text-sm bg-muted" />
            <p className="text-xs text-muted-foreground">Slug is permanent after creation</p>
          </div>
        </div>
      )}

      {activeTab === "faq" && (
        <div className="space-y-4">
          {blog.faqSchema.map((faq, i) => (
            <Card key={i}>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-medium">FAQ {i + 1}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                <Input
                  value={faq.question}
                  onChange={(e) => {
                    const updated = [...blog.faqSchema];
                    updated[i] = { ...updated[i], question: e.target.value };
                    setBlog((b) => b ? { ...b, faqSchema: updated } : b);
                  }}
                  placeholder="Question"
                />
                <Textarea
                  value={faq.answer}
                  onChange={(e) => {
                    const updated = [...blog.faqSchema];
                    updated[i] = { ...updated[i], answer: e.target.value };
                    setBlog((b) => b ? { ...b, faqSchema: updated } : b);
                  }}
                  placeholder="Answer"
                  rows={3}
                />
              </CardContent>
            </Card>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBlog((b) => b ? { ...b, faqSchema: [...b.faqSchema, { question: "", answer: "" }] } : b)}
          >
            + Add FAQ
          </Button>
        </div>
      )}

      {activeTab === "preview" && (
        <Card>
          <CardContent className="pt-5">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: blog.bodyHtml || "<p class='text-muted-foreground'>No content yet.</p>" }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
