"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, PenLine, ChevronRight, Loader2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const CONTENT_TYPES = [
  { value: "location-page", label: "Location Page — rank for '[venue] near [area]'" },
  { value: "comparison", label: "Comparison — 'best X for Y' queries" },
  { value: "how-to", label: "How-To — guides and informational" },
  { value: "faq-cluster", label: "FAQ Cluster — People Also Ask questions" },
  { value: "geo-summary", label: "GEO Summary — for AI engine citations" },
];

interface PickResult {
  chosenKeyword: string;
  reasoning: string;
  estimatedDifficulty: string;
  intent: string;
  contentType: string;
}

export default function NewBlogPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"ai" | "manual">("ai");

  // AI mode
  const [seedInput, setSeedInput] = useState("");
  const [seeds, setSeeds] = useState<string[]>([]);
  const [contentType, setContentType] = useState("location-page");
  const [picking, setPicking] = useState(false);
  const [pickResult, setPickResult] = useState<PickResult | null>(null);
  const [generating, setGenerating] = useState(false);

  // Manual mode
  const [manualKeyword, setManualKeyword] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualType, setManualType] = useState("location-page");
  const [saving, setSaving] = useState(false);

  const addSeed = () => {
    const kw = seedInput.trim();
    if (kw && !seeds.includes(kw)) setSeeds((s) => [...s, kw]);
    setSeedInput("");
  };

  const pickKeyword = async () => {
    if (seeds.length < 1) { toast.error("Add at least one seed keyword"); return; }
    setPicking(true);
    setPickResult(null);
    try {
      const res = await fetch("/api/admin/blog/pick-keyword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: seeds, contentType }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setPickResult(data.data);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Keyword picking failed");
    } finally {
      setPicking(false);
    }
  };

  const generateBlog = async () => {
    if (!pickResult) return;
    setGenerating(true);
    try {
      // Create stub blog first
      const createRes = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKeyword: pickResult.chosenKeyword,
          contentType: pickResult.contentType || contentType,
          status: "brief_generated",
        }),
      });
      const created = await createRes.json();
      if (!created.success) throw new Error(created.error);

      const blogId = created.data._id;

      // Generate content
      const genRes = await fetch(`/api/admin/blog/${blogId}/generate`, { method: "POST" });
      const genData = await genRes.json();
      if (!genData.success) throw new Error(genData.error);

      toast.success("Blog generated — review before publishing");
      router.push(`/admin/blog/${blogId}`);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Generation failed");
      setGenerating(false);
    }
  };

  const saveManual = async () => {
    if (!manualKeyword) { toast.error("Target keyword required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKeyword: manualKeyword,
          title: manualTitle || manualKeyword,
          contentType: manualType,
          status: "keyword_identified",
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Blog created");
      router.push(`/admin/blog/${data.data._id}`);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Blog Post</h1>
        <p className="text-sm text-muted-foreground mt-1">Let AI pick the best keyword, or create manually</p>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-2">
        <Button
          variant={mode === "ai" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("ai")}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" /> AI Generate
        </Button>
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("manual")}
        >
          <PenLine className="h-3.5 w-3.5 mr-1.5" /> Manual
        </Button>
      </div>

      {mode === "ai" ? (
        <div className="space-y-5">
          {/* Seed keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Seed Keywords</CardTitle>
              <CardDescription>Enter 3–10 keyword ideas. The AI will pick the best one based on SEO potential.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. farmhouses near shamirpet hyderabad"
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSeed())}
                  className="h-9"
                />
                <Button variant="outline" size="sm" onClick={addSeed}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {seeds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {seeds.map((kw) => (
                    <Badge key={kw} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                      {kw}
                      <button onClick={() => setSeeds((s) => s.filter((k) => k !== kw))} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content type */}
          <div className="space-y-1.5">
            <Label>Content Type</Label>
            <Select value={contentType} onValueChange={(v) => setContentType(v ?? "location-page")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={pickKeyword} disabled={picking || seeds.length === 0} className="w-full">
            {picking ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing keywords…</> : "Pick Best Keyword"}
          </Button>

          {/* AI reasoning result */}
          {pickResult && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Chosen keyword</p>
                    <p className="font-semibold text-foreground">{pickResult.chosenKeyword}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs capitalize">{pickResult.intent}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{pickResult.estimatedDifficulty}</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{pickResult.reasoning}</p>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={generateBlog} disabled={generating} className="flex-1">
                    {generating
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating blog…</>
                      : <><Sparkles className="h-4 w-4 mr-2" /> Generate Full Blog <ChevronRight className="h-4 w-4 ml-1" /></>
                    }
                  </Button>
                  <Button size="sm" variant="outline" onClick={pickKeyword} disabled={generating}>
                    Re-pick
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-1.5">
              <Label>Target Keyword <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. farmhouse birthday party hyderabad"
                value={manualKeyword}
                onChange={(e) => setManualKeyword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Title (optional)</Label>
              <Input
                placeholder="Leave blank to use keyword as title"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Content Type</Label>
              <Select value={manualType} onValueChange={(v) => setManualType(v ?? "location-page")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveManual} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Blog
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
