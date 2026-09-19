import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type MarketplaceItem = Tables<"marketplace_items">;
export type MarketplaceItemInsert = TablesInsert<"marketplace_items">;
export type MarketplaceStatus = "published" | "sold" | "removed";

const MARKETPLACE_COLUMNS =
  "id,user_id,title,price,category,condition,dorm,seller,phone,description,image_url,status,created_at,updated_at";

export async function fetchMarketplaceItems() {
  const { data, error } = await supabase
    .from("marketplace_items")
    .select(MARKETPLACE_COLUMNS)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchAllMarketplaceItems() {
  const { data, error } = await supabase
    .from("marketplace_items")
    .select(MARKETPLACE_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchMarketplaceItem(id: string) {
  const { data, error } = await supabase
    .from("marketplace_items")
    .select(MARKETPLACE_COLUMNS)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createMarketplaceItem(item: MarketplaceItemInsert) {
  const { data, error } = await supabase
    .from("marketplace_items")
    .insert(item)
    .select(MARKETPLACE_COLUMNS)
    .single();

  if (error) throw error;
  return data;
}

export async function updateMarketplaceItemStatus(id: string, status: MarketplaceStatus) {
  const { data, error } = await supabase
    .from("marketplace_items")
    .update({ status })
    .eq("id", id)
    .select(MARKETPLACE_COLUMNS)
    .single();

  if (error) throw error;
  return data;
}

export type SiteMessage = {
  id: string;
  name: string;
  message: string;
  created_at: string;
};

export async function fetchSiteMessages() {
  const { data, error } = await (supabase as any)
    .from("site_messages")
    .select("id,name,message,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data ?? []).reverse() as SiteMessage[];
}

export async function createSiteMessage(name: string, message: string) {
  const { data, error } = await (supabase as any)
    .from("site_messages")
    .insert({ name: name.trim() || "Student", message: message.trim() })
    .select("id,name,message,created_at")
    .single();

  if (error) throw error;
  return data as SiteMessage;
}

export async function uploadMarketplacePhoto(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `public/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("marketplace-photos").upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = await supabase.storage.from("marketplace-photos").createSignedUrl(filePath, 60 * 60 * 24 * 365);
  if (!data?.signedUrl) throw new Error("Could not create photo display URL");

  return data.signedUrl;
}
