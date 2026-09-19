import { useEffect, useState } from "react";

const WATCHLIST_KEY = "campustrade-watchlist";

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(WATCHLIST_KEY);
      if (saved) setWatchlist(JSON.parse(saved));
    } catch {
      setWatchlist([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  function toggleWatchlist(id: string) {
    setWatchlist((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id],
    );
  }

  return {
    watchlist,
    toggleWatchlist,
    isWatched: (id: string) => watchlist.includes(id),
  };
}
