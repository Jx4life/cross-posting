
-- Add earnings column to post_analytics table
ALTER TABLE public.post_analytics 
ADD COLUMN earnings NUMERIC(12,2) DEFAULT 0;

-- Update the existing trigger to handle the new column
DROP TRIGGER IF EXISTS update_post_analytics_updated_at ON public.post_analytics;

CREATE TRIGGER update_post_analytics_updated_at
    BEFORE UPDATE ON public.post_analytics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add some sample earnings data for testing (optional)
-- UPDATE public.post_analytics SET earnings = ROUND((RANDOM() * 100)::numeric, 2) WHERE earnings = 0;
