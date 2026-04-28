
CREATE TABLE public.early_access_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('pro', 'customer')),
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.early_access_signups ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can insert
CREATE POLICY "Anyone can sign up for early access"
  ON public.early_access_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can view early access signups"
  ON public.early_access_signups
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
