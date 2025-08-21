-- Add 'facebook' to the platform_type enum if it doesn't exist
DO $$ 
BEGIN
    -- Check if 'facebook' already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'facebook' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'platform_type'
        )
    ) THEN
        -- Add 'facebook' to the enum
        ALTER TYPE platform_type ADD VALUE 'facebook';
        RAISE NOTICE 'Added facebook to platform_type enum';
    ELSE
        RAISE NOTICE 'facebook already exists in platform_type enum';
    END IF;
END $$;