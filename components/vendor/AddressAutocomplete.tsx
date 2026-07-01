"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Prediction {
  description: string;
  placeId: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AddressAutocomplete({ value, onChange, placeholder }: AddressAutocompleteProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchPredictions = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 3) {
      setPredictions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/vendor/address-suggest?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        const preds: Prediction[] = data.predictions ?? [];
        setPredictions(preds);
        setOpen(preds.length > 0);
      } catch {
        setPredictions([]);
      }
    }, 350);
  };

  useEffect(() => {
    function close(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          fetchPredictions(e.target.value);
        }}
        placeholder={placeholder}
        autoComplete="off"
      />

      {open && predictions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-52 overflow-y-auto">
          {predictions.map((p) => (
            <button
              key={p.placeId}
              type="button"
              onClick={() => {
                onChange(p.description);
                setPredictions([]);
                setOpen(false);
              }}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-accent transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span className="text-foreground leading-snug">{p.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
