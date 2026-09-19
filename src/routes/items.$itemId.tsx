import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Heart, ImageIcon, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TopProgressBar } from "@/components/top-progress-bar";
import { supabase } from "@/integrations/supabase/client";
import { fetchMarketplaceItem, fetchMarketplaceItems, type MarketplaceItem } from "@/lib/marketplace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/items/$itemId")({
  loader: async ({ params }) => {
    const item = await fetchMarketplaceItem(params.itemId);
    if (!item) throw notFound();
    return item;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — CampusTrade` },
          { name: "description", content: `${loaderData.title} for $${loaderData.price} from ${loaderData.dorm}.` },
          { property: "og:title", content: `${loaderData.title} — CampusTrade` },
          { property: "og:description", content: loaderData.description },
          ...(loaderData.image_url
            ? [
                { property: "og:image", content: loaderData.image_url },
                { name: "twitter:image", content: loaderData.image_url },
              ]
            : []),
        ]
      : [{ title: "CampusTrade Listing" }],
  }),
  pendingComponent: ItemPending,
  notFoundComponent: ItemNotFound,
  errorComponent: ItemError,
  component: ItemDetailPage,
});

function ItemPending() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <TopProgressBar active />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="mb-6 h-10 w-36" />
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-12 w-4/5" />
            <Skeleton className="h-24 w-full" />
          </div>
        </section>
      </div>
    </main>
  );
}

function ItemNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-bold">Listing not found</h1>
        <p className="Sample Message">This campus item may have been sold or removed.</p>
        <Button asChild variant="energetic">
          <Link to="/">Back to marketplace</Link>
        </Button>
      </div>
    </main>
  );
}

function ItemError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-bold">Couldn’t load listing</h1>
        <p className="Sample Message">Sample Text</p>
        <Button asChild variant="energetic">
          <Link to="/">Back to marketplace</Link>
        </Button>
      </div>
    </main>
  );
}

function ItemDetailPage() {
  const initialItem = Route.useLoaderData();
  const [item, setItem] = useState(initialItem);
  const [nearbyItems, setNearbyItems] = useState<MarketplaceItem[]>([]);
  const [watchedItems, setWatchedItems] = useState<string[]>(() => readWatchlist());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const message = encodeURIComponent(
    `Hi ${item.seller}, I saw your ${item.title} on CampusTrade. Is it still available?`,
  );
  const whatsappUrl = `https://wa.me/${item.phone}?text=${message}`;

  useEffect(() => {
    setItem(initialItem);
  }, [initialItem]);

  useEffect(() => {
    window.localStorage.setItem("campus-trade-watchlist", JSON.stringify(watchedItems));
  }, [watchedItems]);

  useEffect(() => {
    let mounted = true;

    async function refreshItems() {
      setIsRefreshing(true);
      try {
        const [updatedItem, allItems] = await Promise.all([fetchMarketplaceItem(item.id), fetchMarketplaceItems()]);
        if (!mounted) return;
        if (updatedItem) setItem(updatedItem);
        setNearbyItems(allItems.filter((nearby) => nearby.id !== item.id).slice(0, 3));
      } finally {
        if (mounted) setIsRefreshing(false);
      }
    }

    refreshItems();

    const channel = supabase
      .channel(`marketplace-item-${item.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "marketplace_items" },
        () => refreshItems(),
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [item.id]);

  function toggleWatchlist(itemId: string) {
    setWatchedItems((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <TopProgressBar active={isRefreshing} />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft /> Marketplace
            </Link>
          </Button>
          <button
            onClick={() => toggleWatchlist(item.id)}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm transition hover:border-accent hover:text-accent"
          >
            <Heart className={cn("size-4", watchedItems.includes(item.id) && "fill-accent text-accent")} /> Watchlist
          </button>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="Sample Message">
                <ImageIcon className="size-12" />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant={item.condition === "New" ? "success" : "secondary"}>{item.condition}</Badge>
                <Badge variant="outline">{item.category}</Badge>
              </div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-4xl font-bold tracking-tight">{item.title}</h1>
                <p className="rounded-2xl bg-secondary px-4 py-2 text-2xl font-bold text-secondary-foreground">
                  {formatPrice(item.price)}
                </p>
              </div>
              <p className="Sample Message">{item.description}</p>
            </div>

            <section className="campus-card rounded-3xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="Sample Message">Seller</p>
                  <h2 className="text-xl font-semibold">{item.seller}</h2>
                  <p className="Sample Message">
                    <MapPin className="size-4" /> {item.dorm}
                  </p>
                </div>
                <Badge variant="trust" className="gap-1.5">
                  <ShieldCheck className="size-3.5" /> Verified Student
                </Badge>
              </div>
              <Button asChild variant="whatsapp" className="mt-5 h-12 w-full rounded-xl">
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  <MessageCircle /> Chat on WhatsApp
                </a>
              </Button>
            </section>

            <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <h2 className="font-semibold">Recommended Meetup Spots</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {["Main Library", "Main Canteen", "Student Center"].map((spot) => (
                  <div key={spot} className="Sample Message">
                    {spot}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>

        {nearbyItems.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-2xl font-bold tracking-tight">More nearby listings</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {nearbyItems.map((nearby) => (
                <Link
                  key={nearby.id}
                  to="/items/$itemId"
                  params={{ itemId: nearby.id }}
                  className="group rounded-3xl border border-border bg-card p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  {nearby.image_url ? (
                    <img
                      src={nearby.image_url}
                      alt={nearby.title}
                      loading="lazy"
                      className="aspect-[4/3] w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="Sample Message">
                      <ImageIcon className="size-8" />
                    </div>
                  )}
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold group-hover:text-secondary">{nearby.title}</p>
                      <p className="Sample Message">{nearby.dorm}</p>
                    </div>
                    <p className="font-bold">{formatPrice(nearby.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function formatPrice(price: number) {
  return price === 0 ? "Free" : `₹${Math.round(price).toLocaleString("en-IN")}`;
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
