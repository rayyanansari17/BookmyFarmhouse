"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, MessageSquare, Brain, Globe } from "lucide-react";

export default function AeoSignalsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AEO / GEO Signals</h1>
        <p className="text-sm text-muted-foreground mt-1">Answer Engine Optimization and Generative Engine signals for AI citations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Branded Query Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground py-6 text-center">
              Connect GSC and sync data to see branded query impressions trend.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" /> Schema Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground py-6 text-center">
              Schema coverage analysis requires published blogs with FAQ and Article schema.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> GEO Block Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground py-6 text-center">
              Publish blogs with GEO answer blocks filled in to improve AI engine citation rates.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4" /> Bing Webmaster Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground py-6 text-center">
              Phase E — Bing Webmaster Tools API integration not yet implemented.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed border-primary/30">
        <CardContent className="pt-5 pb-5 text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
          <p className="font-medium text-foreground mb-1">AEO signals improve with published content</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Fill in the <strong>GEO Answer Block</strong> field in every blog post — it provides direct-answer content
            that AI engines like Perplexity, ChatGPT, and Gemini can cite.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
