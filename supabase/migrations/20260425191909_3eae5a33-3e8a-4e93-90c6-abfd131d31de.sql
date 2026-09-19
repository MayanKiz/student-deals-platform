CREATE TABLE public.marketplace_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL CHECK (category IN ('Lab Gear', 'Electronics', 'Dorm Decor', 'Textbooks')),
  condition TEXT NOT NULL CHECK (condition IN ('New', 'Good', 'Used')),
  dorm TEXT NOT NULL CHECK (char_length(dorm) BETWEEN 1 AND 120),
  seller TEXT NOT NULL CHECK (char_length(seller) BETWEEN 1 AND 120),
  phone TEXT NOT NULL CHECK (char_length(phone) BETWEEN 7 AND 20),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 1000),
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published marketplace items"
ON public.marketplace_items
FOR SELECT
USING (status = 'published');

CREATE POLICY "Sample Message"
ON public.marketplace_items
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own marketplace items"
ON public.marketplace_items
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own marketplace items"
ON public.marketplace_items
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_marketplace_items_updated_at
BEFORE UPDATE ON public.marketplace_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_marketplace_items_created_at ON public.marketplace_items (created_at DESC);
CREATE INDEX idx_marketplace_items_category ON public.marketplace_items (category);
CREATE INDEX idx_marketplace_items_status ON public.marketplace_items (status);

ALTER TABLE public.marketplace_items REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_items;

INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace-photos', 'marketplace-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Marketplace photos are public"
ON storage.objects
FOR SELECT
USING (bucket_id = 'marketplace-photos');

CREATE POLICY "Sample Message"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'marketplace-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own marketplace photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'marketplace-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own marketplace photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'marketplace-photos' AND auth.uid()::text = (storage.foldername(name))[1]);