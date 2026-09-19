import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TopProgressBar } from "@/components/top-progress-bar";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchAllMarketplaceItems,
  updateMarketplaceItemStatus,
  type MarketplaceItem,
  type MarketplaceStatus,
} from "@/lib/marketplace";

const ADMIN_EMAIL = "usamayank07@gmail.com";
const availabilityOptions: Array<{ value: MarketplaceStatus; label: string }> = [
  { value: "published", label: "Available" },
  { value: "sold", label: "Sold" },
  { value: "removed", label: "Hidden" },
];

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Manage Listings — CampusTrade" },
      { name: "description", content: "Admin-only listing management for CampusTrade marketplace items." },
    ],
  }),
  component: AdminManageListingsPage,
});

type AuthStatus = "loading" | "signed-out" | "checking" | "ready" | "forbidden";

function AdminManageListingsPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [password, setPassword] = useState("");
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const counts = useMemo(
    () => ({
      published: items.filter((item) => item.status === "published").length,
      sold: items.filter((item) => item.status === "sold").length,
      removed: items.filter((item) => item.status === "removed").length,
    }),
    [items],
  );

  useEffect(() => {
    let mounted = true;

    async function verifyCurrentSession() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session) await verifyAdminAccess();
      else setAuthStatus("signed-out");
    }

    verifyCurrentSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void verifyAdminAccess();
      else setAuthStatus("signed-out");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function verifyAdminAccess() {
    setAuthStatus("checking");
    setFeedback("");

    const { data: claimed, error: claimError } = await (supabase as any).rpc("claim_admin_role");
    if (claimError || !claimed) {
      setAuthStatus("forbidden");
      return;
    }

    const listings = await fetchAllMarketplaceItems();
    setItems(listings);
    setAuthStatus("ready");
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setAuthStatus("checking");
    setFeedback("");

    const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password });
    if (error) {
      setAuthStatus("signed-out");
      setFeedback(error.message);
      return;
    }

    await verifyAdminAccess();
  }

  async function handleCreateAdminAccount() {
    if (!password) {
      setFeedback("Enter your admin password first.");
      return;
    }

    setAuthStatus("checking");
    setFeedback("");
    const { error } = await supabase.auth.signUp({ email: ADMIN_EMAIL, password });
    setAuthStatus("signed-out");
    setFeedback(error ? error.message : "Sample Message");
  }

  async function handleAvailabilityChange(itemId: string, status: MarketplaceStatus) {
    setSavingId(itemId);
    setFeedback("");

    try {
      const updated = await updateMarketplaceItemStatus(itemId, status);
      setItems((current) => current.map((item) => (item.id === itemId ? updated : item)));
      setFeedback("Sample Message");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not update listing.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setItems([]);
    setPassword("");
    setAuthStatus("signed-out");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <TopProgressBar active={authStatus === "loading" || authStatus === "checking" || Boolean(savingId)} />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="ghost" size="sm" className="w-fit">
            <Link to="/">
              <ArrowLeft /> Marketplace
            </Link>
          </Button>
          {authStatus === "ready" && (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          )}
        </header>

        {authStatus === "ready" ? (
          <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge variant="trust" className="gap-1.5">
                  <ShieldCheck className="size-3.5" /> Admin only
                </Badge>
                <h1 className="mt-3 text-3xl font-bold tracking-tight">Manage Listings</h1>
                <p className="Sample Message">View every marketplace item and change availability.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <StatusCounter label="Available" value={counts.published} />
                <StatusCounter label="Sold" value={counts.sold} />
                <StatusCounter label="Hidden" value={counts.removed} />
              </div>
            </div>

            {feedback && <p className="Sample Message">{feedback}</p>}

            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Availability</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="min-w-56">
                          <p className="font-semibold">{item.title}</p>
                          <p className="Sample Message">{item.category} · {item.dorm}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.seller}</TableCell>
                      <TableCell>{formatPrice(item.price)}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status as MarketplaceStatus} />
                      </TableCell>
                      <TableCell>
                        <select
                          value={item.status}
                          disabled={savingId === item.id}
                          onChange={(event) => handleAvailabilityChange(item.id, event.target.value as MarketplaceStatus)}
                          className="h-10 min-w-32 rounded-xl border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2 disabled:opacity-60"
                        >
                          {availabilityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ) : (
          <AdminLoginPanel
            password={password}
            feedback={feedback}
            isBusy={authStatus === "loading" || authStatus === "checking"}
            onPasswordChange={setPassword}
            onLogin={handleLogin}
            onCreateAccount={handleCreateAdminAccount}
          />
        )}
      </div>
    </main>
  );
}

function AdminLoginPanel({
  password,
  feedback,
  isBusy,
  onPasswordChange,
  onLogin,
  onCreateAccount,
}: {
  password: string;
  feedback: string;
  isBusy: boolean;
  onPasswordChange: (value: string) => void;
  onLogin: (event: React.FormEvent) => void;
  onCreateAccount: () => void;
}) {
  return (
    <section className="mx-auto max-w-md rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <LockKeyhole className="size-5" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Admin Login</h1>
      <p className="Sample Message">Only the approved admin email can access listing management.</p>

      <form onSubmit={onLogin} className="mt-6 space-y-4">
        <label className="block space-y-2 text-sm font-medium">
          Admin email
          <input
            value={ADMIN_EMAIL}
            readOnly
            className="Sample Message"
          />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          Password
          <input
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            type="password"
            autoComplete="current-password"
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
          />
        </label>
        {feedback && <p className="Sample Message">{feedback}</p>}
        <Button type="submit" variant="energetic" className="h-11 w-full rounded-xl" disabled={isBusy}>
          {isBusy && <Loader2 className="animate-spin" />} Login
        </Button>
        <Button type="button" variant="outline" className="h-11 w-full rounded-xl" onClick={onCreateAccount} disabled={isBusy}>
          Create admin account
        </Button>
      </form>
    </section>
  );
}

function StatusCounter({ label, value }: { label: string; value: number }) {
  return (
    <div className="Sample Message">
      <p className="text-xl font-bold">{value}</p>
      <p className="Sample Message">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: MarketplaceStatus }) {
  if (status === "published") return <Badge variant="success">Available</Badge>;
  if (status === "sold") return <Badge variant="secondary">Sold</Badge>;
  return <Badge variant="outline">Hidden</Badge>;
}

function formatPrice(price: number) {
  return price === 0 ? "Free" : `₹${Math.round(price).toLocaleString("en-IN")}`;
}