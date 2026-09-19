CREATE OR REPLACE FUNCTION public.claim_admin_role()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_email text;
BEGIN
  current_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  IF current_email <> 'usamayank07@gmail.com' THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_admin_by_email(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assign_admin_by_email(text) FROM anon;
REVOKE ALL ON FUNCTION public.assign_admin_by_email(text) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.claim_admin_role() TO authenticated;