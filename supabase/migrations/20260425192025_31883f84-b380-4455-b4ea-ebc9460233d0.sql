CREATE POLICY "Visitors can create public marketplace items"
ON public.marketplace_items
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL AND status = 'published');