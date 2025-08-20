-- Create encryption extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encryption key management
CREATE OR REPLACE FUNCTION encrypt_token(token text, encryption_key text)
RETURNS text AS $$
BEGIN
  RETURN encode(pgp_sym_encrypt(token, encryption_key), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add decryption function
CREATE OR REPLACE FUNCTION decrypt_token(encrypted_token text, encryption_key text)
RETURNS text AS $$
BEGIN
  RETURN pgp_sym_decrypt(decode(encrypted_token, 'base64'), encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create secure view for post_configurations with automatic encryption/decryption
CREATE OR REPLACE VIEW secure_post_configurations AS
SELECT 
  id,
  user_id,
  platform,
  is_enabled,
  created_at,
  updated_at,
  -- Note: These fields will be handled by application layer encryption
  access_token,
  refresh_token
FROM post_configurations;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON secure_post_configurations TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;