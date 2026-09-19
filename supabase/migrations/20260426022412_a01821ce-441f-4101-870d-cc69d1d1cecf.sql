ALTER TABLE public.marketplace_items
  DROP CONSTRAINT IF EXISTS marketplace_items_price_check;

ALTER TABLE public.marketplace_items
  ADD CONSTRAINT marketplace_items_price_check CHECK (price >= 0);

ALTER TABLE public.marketplace_items
  DROP CONSTRAINT IF EXISTS marketplace_items_status_check;

ALTER TABLE public.marketplace_items
  ADD CONSTRAINT marketplace_items_status_check CHECK (status IN ('published', 'sold', 'removed'));

DROP TRIGGER IF EXISTS update_marketplace_items_updated_at ON public.marketplace_items;

CREATE TRIGGER update_marketplace_items_updated_at
BEFORE UPDATE ON public.marketplace_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Visitors can manage anonymous marketplace items" ON public.marketplace_items;

CREATE POLICY "Visitors can manage anonymous marketplace items"
ON public.marketplace_items
FOR UPDATE
TO anon
USING (user_id IS NULL AND status = 'published')
WITH CHECK (user_id IS NULL AND status IN ('sold', 'removed'));

CREATE TABLE IF NOT EXISTS public.site_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Student',
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view recent site messages" ON public.site_messages;
CREATE POLICY "Everyone can view recent site messages"
ON public.site_messages
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Visitors can post site messages" ON public.site_messages;
CREATE POLICY "Visitors can post site messages"
ON public.site_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (char_length(trim(name)) BETWEEN 1 AND 40 AND char_length(trim(message)) BETWEEN 1 AND 240);

ALTER PUBLICATION supabase_realtime ADD TABLE public.site_messages;