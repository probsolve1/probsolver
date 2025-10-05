-- Create published_codes table for storing AI-generated code
CREATE TABLE public.published_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  html_content TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on slug for faster lookups
CREATE INDEX idx_published_codes_slug ON public.published_codes(slug);

-- Create index on created_at for sorting
CREATE INDEX idx_published_codes_created_at ON public.published_codes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.published_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view published codes (public access)
CREATE POLICY "Anyone can view published codes"
ON public.published_codes
FOR SELECT
USING (true);

-- Allow anyone to create published codes (no auth required for now)
CREATE POLICY "Anyone can publish codes"
ON public.published_codes
FOR INSERT
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_published_codes_updated_at
BEFORE UPDATE ON public.published_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();