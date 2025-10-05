-- Fix function search path security warning by recreating function and trigger
DROP TRIGGER IF EXISTS update_published_codes_updated_at ON public.published_codes;
DROP FUNCTION IF EXISTS public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public;

CREATE TRIGGER update_published_codes_updated_at
BEFORE UPDATE ON public.published_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();