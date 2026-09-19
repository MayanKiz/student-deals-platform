import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ImageIcon, Loader2, MessageCircle, Search, Send, ShieldCheck, SlidersHorizontal, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TopProgressBar } from "@/components/top-progress-bar";
import { categories, type Category } from "@/data-campus-trade";
import { supabase } from "@/integrations/supabase/client";
import {
  createSiteMessage,
  fetchMarketplaceItems,
  fetchSiteMessages,
  type MarketplaceItem,
  type SiteMessage,
} from "@/lib/marketplace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CampusTrade — Student Marketplace" },
      {
        name: "description",
        content: "Buy and sell lab gear, electronics, dorm decor, and textbooks with verified students on campus.",
      },
      { property: "og:title", content: "CampusTrade — Student Marketplace" },
      {
        property: "og:description",
        content: "A hyper-local peer-to-peer marketplace for college students.",
      },
    ],
  }),
  component: Index,
});

type SortMode = "featured" | "low" | "high";

function Index() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "All">("All");
  const [sort, setSort] = useState<SortMode>("featured");
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [watchedItems, setWatchedItems] = useState<string[]>(() => readWatchlist());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [messages, setMessages] = useState<SiteMessage[]>([]);
  const [chatName, setChatName] = useState("Student");
  const [chatMessage, setChatMessage] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadItems(showSkeleton = false) {
      if (showSkeleton) setIsLoading(true);
      setIsRefreshing(true);
      try {
        const data = await fetchMarketplaceItems();
        if (mounted) setItems(data);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    loadItems(true);

    const channel = supabase
      .channel("marketplace-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "marketplace_items" },
        () => loadItems(),
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadMessages() {
      const data = await fetchSiteMessages();
      if (mounted) setMessages(data);
    }

    loadMessages();

    const channel = supabase
      .channel("campus-chat")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_messages" }, () => loadMessages())
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem("campus-trade-watchlist", JSON.stringify(watchedItems));
  }, [watchedItems]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = items.filter((item) => {
      const matchesQuery = [item.title, item.category, item.dorm, item.seller]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesCategory = category === "All" || item.category === category;
      return matchesQuery && matchesCategory;
    });

    return [...matches].sort((a, b) => {
      if (sort === "low") return a.price - b.price;
      if (sort === "high") return b.price - a.price;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [category, items, query, sort]);

  function toggleWatchlist(itemId: string) {
    setWatchedItems((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
    );
  }

  async function handleChatSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!chatMessage.trim()) return;
    setIsChatSending(true);

    try {
      await createSiteMessage(chatName, chatMessage);
      setChatMessage("");
    } finally {
      setIsChatSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <TopProgressBar active={isLoading || isRefreshing} />
      <section className="campus-hero border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8 lg:py-10">
          <div className="flex flex-col justify-between gap-8">
            <header className="flex items-center justify-between gap-4">
              <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  CT
                </span>
                <span>CampusTrade</span>
              </Link>
              <Button asChild variant="energetic" size="sm">
                <Link to="/sell">
                  <Upload /> Sell
                </Link>
              </Button>
            </header>

            <div className="max-w-3xl space-y-5 py-4 lg:py-10">
              <Badge variant="trust" className="gap-1.5">
                <ShieldCheck className="size-3.5" /> Verified student marketplace
              </Badge>
              <div className="space-y-3">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  Trade campus essentials before the next lecture.
                </h1>
                <p className="Sample Message">
                  Find lab gear, textbooks, dorm upgrades, and electronics from students in nearby hostels and dorms.
                </p>
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-2 shadow-sm sm:flex-row">
                <label className="relative flex min-h-12 flex-1 items-center">
                  <Search className="Sample Message" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search calculators, lamps, lab coats..."
                    className="Sample Message"
                  />
                </label>
                <Button variant="energetic" className="h-12 rounded-xl">
                  Search
                </Button>
              </div>
            </div>
          </div>

          <aside className="campus-card campus-float hidden rounded-3xl border border-border bg-card p-5 lg:block">
            <div className="Sample Message">
              <ImageIcon className="size-12" />
            </div>
            <div className="mt-4 space-y-3">
              <p className="Sample Message">Live listings from students</p>
              <h2 className="text-xl font-semibold">Fresh posts appear automatically</h2>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <FilterPanel category={category} sort={sort} onCategoryChange={setCategory} onSortChange={setSort} />

        <div className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-secondary">{filteredItems.length} campus finds</p>
              <h2 className="text-2xl font-bold tracking-tight">Marketplace</h2>
            </div>
            <div className="Sample Message">
              <Heart className="size-4 fill-accent text-accent" /> {watchedItems.length} saved to watchlist
            </div>
          </div>

          {isLoading ? (
            <ProductGridSkeleton />
          ) : filteredItems.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  watched={watchedItems.includes(item.id)}
                  onWatch={() => toggleWatchlist(item.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-lg font-semibold">No live listings yet</p>
              <p className="Sample Message">Post the first item from the seller dashboard.</p>
            </div>
          )}
        </div>
      </section>
      <CampusChat
        name={chatName}
        message={chatMessage}
        messages={messages}
        isSending={isChatSending}
        isOpen={isChatOpen}
        onOpenChange={setIsChatOpen}
        onNameChange={setChatName}
        onMessageChange={setChatMessage}
        onSubmit={handleChatSubmit}
      />
    </main>
  );
}

function readWatchlist() {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem("campus-trade-watchlist");
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

function FilterPanel({
  category,
  sort,
  onCategoryChange,
  onSortChange,
}: {
  category: Category | "All";
  sort: SortMode;
  onCategoryChange: (category: Category | "All") => void;
  onSortChange: (sort: SortMode) => void;
}) {
  return (
    <aside className="h-fit rounded-3xl border border-border bg-card p-4 shadow-sm lg:sticky lg:top-6">
      <div className="mb-4 flex items-center gap-2 font-semibold">
        <SlidersHorizontal className="size-4 text-secondary" /> Filters
      </div>
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium">Category</p>
          <div className="flex flex-wrap gap-2 lg:flex-col">
            {["All", ...categories].map((item) => (
              <button
                key={item}
                onClick={() => onCategoryChange(item as Category | "All")}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-sm transition hover:border-secondary hover:text-secondary",
                  category === item
                    ? "border-secondary bg-secondary text-secondary-foreground hover:text-secondary-foreground"
                    : "border-border bg-background text-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Sort by price</p>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortMode)}
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
          >
            <option value="featured">Newest first</option>
            <option value="low">Lowest first</option>
            <option value="high">Highest first</option>
          </select>
        </div>
      </div>
    </aside>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="size-10 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CampusChat({
  name,
  message,
  messages,
  isSending,
  isOpen,
  onOpenChange,
  onNameChange,
  onMessageChange,
  onSubmit,
}: {
  name: string;
  message: string;
  messages: SiteMessage[];
  isSending: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onNameChange: (name: string) => void;
  onMessageChange: (message: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        aria-label="Open campus chat"
        className="fixed bottom-4 left-4 z-40 flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-lg transition hover:scale-105"
      >
        <MessageCircle className="size-6" />
      </button>
    );
  }

  return (
    <section className="fixed bottom-4 left-4 z-40 w-[calc(100vw-2rem)] max-w-sm rounded-3xl border border-border bg-card p-3 shadow-lg">
      <div className="mb-3 flex items-center justify-between gap-2 font-semibold">
        <span className="flex items-center gap-2"><MessageCircle className="size-4 text-secondary" /> Campus Chat</span>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close campus chat"
          className="Sample Message"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="Sample Message">
        {messages.length > 0 ? (
          messages.map((item) => (
            <div key={item.id} className="rounded-2xl bg-card p-2 text-sm">
              <p className="font-semibold">{item.name}</p>
              <p className="Sample Message">{item.message}</p>
            </div>
          ))
        ) : (
          <p className="Sample Message">No messages yet.</p>
        )}
      </div>
      <form onSubmit={onSubmit} className="mt-3 grid gap-2">
        <input
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          maxLength={40}
          placeholder="Your name"
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
        />
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            maxLength={240}
            placeholder="Message everyone..."
            className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
          />
          <Button type="submit" size="icon" variant="energetic" disabled={isSending || !message.trim()}>
            {isSending ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </div>
      </form>
    </section>
  );
}

function ItemCard({ item, watched, onWatch }: { item: MarketplaceItem; watched: boolean; onWatch: () => void }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link to="/items/$itemId" params={{ itemId: item.id }} className="block">
        <div className="Sample Message">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="Sample Message">
              <ImageIcon className="size-10" />
            </div>
          )}
          <Badge className="absolute left-3 top-3" variant={item.condition === "New" ? "success" : "secondary"}>
            {item.condition}
          </Badge>
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link to="/items/$itemId" params={{ itemId: item.id }} className="font-semibold hover:text-secondary">
              {item.title}
            </Link>
            <p className="Sample Message">{item.dorm}</p>
          </div>
          <p className="text-lg font-bold">{formatPrice(item.price)}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <Badge variant="outline">{item.category}</Badge>
          <button
            onClick={onWatch}
            aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
            className="Sample Message"
          >
            <Heart className={cn("size-4", watched && "fill-accent text-accent")} />
          </button>
        </div>
      </div>
    </article>
  );
}

function formatPrice(price: number) {
  return price === 0 ? "Free" : `₹${Math.round(price).toLocaleString("en-IN")}`;
}
