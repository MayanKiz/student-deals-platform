// @lovable.dev/vite-tanstack-config already includes the following:
// tanstackStart, React, Tailwind, tsconfig paths, Cloudflare build support,
// VITE_* env handling, aliases, and TanStack dedupe.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Vercel's Supabase integration provides server environment variables.
// Expose only the public Supabase URL/key to the browser bundle at build time.
// Never expose SUPABASE_SERVICE_ROLE_KEY here.
const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const supabaseKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export default defineConfig({
  nitro: { preset: "vercel" },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabaseKey),
  },
});
