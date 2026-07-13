"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2, ExternalLink, BarChart2, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Blog {
  _id: string;
  slug: string;
  title: string;
  targetKeyword: string;
  contentType: string;
  status: string;
  seoScore: number;
  wordCount: number;
  publishedAt?: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  keyword_identified: "bg-gray-100 text-gray-700",
  brief_generated: "bg-blue-100 text-blue-700",
  content_generated: "bg-purple-100 text-purple-700",
  pending_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-700",
  scheduled: "bg-cyan-100 text-cyan-700",
  published: "bg-emerald-100 text-emerald-700",
  active_monitoring: "bg-teal-100 text-teal-700",
};

const STATUS_LABELS: Record<string, string> = {
  keyword_identified: "Keyword",
  brief_generated: "Brief",
  content_generated: "Generated",
  pending_review: "Review",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  active_monitoring: "Live",
};

export default function BlogListPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/blog?${params}`);
      const data = await res.json();
      if (data.success) setBlogs(data.data);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  const deleteBlog = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      toast.success("Blog deleted");
      setBlogs((prev) => prev.filter((b) => b._id !== id));
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = blogs.filter((b) =>
    search
      ? b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.targetKeyword.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog Posts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and publish SEO blog content</p>
        </div>
        <Button onClick={() => router.push("/admin/blog/new")}>
          <Plus className="h-4 w-4 mr-2" /> New Blog
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search keyword or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.keys(STATUS_LABELS).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {loading ? "Loading…" : `${filtered.length} blog${filtered.length !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No blogs yet.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push("/admin/blog/new")}>
                Create your first blog
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((blog) => (
                <div key={blog._id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/blog/${blog._id}`} className="font-medium text-sm text-foreground hover:text-primary truncate block">
                      {blog.title || blog.targetKeyword}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{blog.targetKeyword}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground capitalize">{blog.contentType?.replace("-", " ")}</span>
                      {blog.wordCount > 0 && (
                        <>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{blog.wordCount.toLocaleString()} words</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {blog.seoScore > 0 && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        blog.seoScore >= 70 ? "bg-green-100 text-green-700" :
                        blog.seoScore >= 40 ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {blog.seoScore}
                      </span>
                    )}
                    <Badge className={`text-xs ${STATUS_COLORS[blog.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {STATUS_LABELS[blog.status] ?? blog.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {blog.status === "published" && (
                      <>
                        <Link href={`/admin/seo/${blog.slug}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <BarChart2 className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <a href={`/blog/${blog.slug}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteBlog(blog._id, blog.title)}
                      disabled={deleting === blog._id}
                    >
                      {deleting === blog._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
