-- Add user_id column to published_codes table
ALTER TABLE public.published_codes 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies to require authentication for INSERT
DROP POLICY IF EXISTS "Anyone can publish codes" ON public.published_codes;

CREATE POLICY "Authenticated users can publish codes" 
ON public.published_codes 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own published codes
CREATE POLICY "Users can update their own codes" 
ON public.published_codes 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own published codes
CREATE POLICY "Users can delete their own codes" 
ON public.published_codes 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Keep SELECT public so anyone can view published codes
-- (existing policy "Anyone can view published codes" remains)