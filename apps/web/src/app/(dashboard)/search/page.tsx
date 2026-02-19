"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Users,
  Building2,
  Handshake,
  List,
  FileText,
  Loader2,
} from "lucide-react";

interface SearchResult {
  type: "record" | "list";
  id: string;
  title: string;
  subtitle: string;
  objectSlug?: string;
  objectName?: string;
  objectIcon?: string;
  url: string;
}

const OBJECT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  people: Users,
  companies: Building2,
  deals: Handshake,
};

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(term)}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.data ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery);
    }
  }, [initialQuery, doSearch]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSearch(query);
    const url = new URL(window.location.href);
    url.searchParams.set("q", query);
    window.history.replaceState({}, "", url.toString());
  }

  const recordResults = results.filter((r) => r.type === "record");
  const listResults = results.filter((r) => r.type === "list");

  const recordsByObject = new Map<string, SearchResult[]>();
  for (const r of recordResults) {
    const key = r.objectName ?? "Other";
    const arr = recordsByObject.get(key) || [];
    arr.push(r);
    recordsByObject.set(key, arr);
  }

  function getIcon(result: SearchResult) {
    if (result.type === "list") return List;
    if (result.objectSlug && OBJECT_ICONS[result.objectSlug]) {
      return OBJECT_ICONS[result.objectSlug];
    }
    return FileText;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Search</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search records, lists..."
            autoFocus
            className="w-full rounded-lg border border-input bg-background px-10 py-2.5 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </form>

      {searched && !loading && results.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">No results found</p>
          <p className="text-sm mt-1">Try searching with different keywords</p>
        </div>
      )}

      {[...recordsByObject.entries()].map(([objectName, recs]) => (
        <div key={objectName} className="mb-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 px-1">
            {objectName} ({recs.length})
          </h2>
          <div className="space-y-1">
            {recs.map((result) => {
              const Icon = getIcon(result);
              return (
                <Link
                  key={result.id}
                  href={result.url}
                  className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 hover:bg-accent transition-colors"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {listResults.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 px-1">
            Lists ({listResults.length})
          </h2>
          <div className="space-y-1">
            {listResults.map((result) => (
              <Link
                key={result.id}
                href={result.url}
                className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 hover:bg-accent transition-colors"
              >
                <List className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">{result.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold mb-6">Search</h1>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
