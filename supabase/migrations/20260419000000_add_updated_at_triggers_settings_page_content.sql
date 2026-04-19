-- Shared trigger function: bumps updated_at to now() on any UPDATE
CREATE OR REPLACE FUNCTION public.bump_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: settings table
DROP TRIGGER IF EXISTS settings_bump_updated_at ON public.settings;
CREATE TRIGGER settings_bump_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW EXECUTE FUNCTION public.bump_updated_at();

-- Trigger: page_content table
DROP TRIGGER IF EXISTS page_content_bump_updated_at ON public.page_content;
CREATE TRIGGER page_content_bump_updated_at
BEFORE UPDATE ON public.page_content
FOR EACH ROW EXECUTE FUNCTION public.bump_updated_at();
