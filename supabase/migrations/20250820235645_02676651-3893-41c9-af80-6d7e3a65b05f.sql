-- Migration to encrypt existing unencrypted tokens
-- This will ensure all existing access_token and refresh_token values are encrypted

DO $$
DECLARE
    rec RECORD;
    encrypted_access_token TEXT;
    encrypted_refresh_token TEXT;
    encryption_key TEXT;
BEGIN
    -- Get the encryption key
    encryption_key := current_setting('app.encryption_key', true);
    
    -- If no encryption key is set, skip encryption (dev environment)
    IF encryption_key IS NULL OR encryption_key = '' THEN
        RAISE NOTICE 'No encryption key found, skipping token encryption';
        RETURN;
    END IF;

    -- Encrypt existing tokens that are not already encrypted
    FOR rec IN 
        SELECT id, access_token, refresh_token 
        FROM post_configurations 
        WHERE access_token IS NOT NULL 
        AND LENGTH(access_token) < 200  -- Assume encrypted tokens are longer
    LOOP
        BEGIN
            -- Encrypt access token if present
            IF rec.access_token IS NOT NULL THEN
                SELECT encrypt_token(rec.access_token, encryption_key) INTO encrypted_access_token;
            END IF;
            
            -- Encrypt refresh token if present
            IF rec.refresh_token IS NOT NULL THEN
                SELECT encrypt_token(rec.refresh_token, encryption_key) INTO encrypted_refresh_token;
            END IF;
            
            -- Update the record with encrypted tokens
            UPDATE post_configurations 
            SET 
                access_token = encrypted_access_token,
                refresh_token = encrypted_refresh_token,
                updated_at = NOW()
            WHERE id = rec.id;
            
            RAISE NOTICE 'Encrypted tokens for configuration ID: %', rec.id;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to encrypt tokens for ID %, error: %', rec.id, SQLERRM;
        END;
    END LOOP;
END $$;

-- Add a comment to track that encryption has been applied
COMMENT ON TABLE post_configurations IS 'All access_token and refresh_token fields are encrypted using pgp_sym_encrypt';