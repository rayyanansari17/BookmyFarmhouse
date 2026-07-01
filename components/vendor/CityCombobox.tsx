"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { INDIA_CITIES } from "@/lib/india-cities";
import { cn } from "@/lib/utils";

interface CityComboboxProps {
  value: string;
  onSelect: (city: string, state: string) => void;
}

export function CityCombobox({ value, onSelect }: CityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.length >= 1
    ? INDIA_CITIES.filter(
        (c) =>
          c.city.toLowerCase().includes(query.toLowerCase()) ||
          c.state.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 60)
    : INDIA_CITIES.slice(0, 60);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = (city: string, state: string) => {
    onSelect(city, state);
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect("", "");
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 h-9 text-sm border border-input rounded-md bg-background transition-colors",
          open ? "border-ring ring-1 ring-ring/30" : "hover:border-ring/50",
        )}
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || "Select city"}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <span
              role="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city or state..."
              className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* City list */}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No city found</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={`${c.city}-${c.state}`}
                  type="button"
                  onClick={() => handleSelect(c.city, c.state)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-accent transition-colors",
                    value === c.city && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <span>{c.city}</span>
                  <span className="text-xs text-muted-foreground">{c.state}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
