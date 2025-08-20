-- Remove the unnecessary secure_post_configurations view as it doesn't provide any security benefit
-- The view was redundant since we're handling encryption at the application layer
DROP VIEW IF EXISTS secure_post_configurations;

-- Revoke the unnecessary permissions that were granted to the view
-- (This will automatically be handled when the view is dropped)

-- Update the encryption functions to be more restrictive and secure
-- These SECURITY DEFINER functions are necessary for encryption but need proper access control

-- Revoke public access and grant only to authenticated users
REVOKE ALL ON FUNCTION encrypt_token(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION encrypt_token(text, text) TO authenticated;

REVOKE ALL ON FUNCTION decrypt_token(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION decrypt_token(text, text) TO authenticated;

-- Add security comments to document why SECURITY DEFINER is needed
COMMENT ON FUNCTION encrypt_token(text, text) IS 'SECURITY DEFINER required for pgcrypto access. Restricted to authenticated users only.';
COMMENT ON FUNCTION decrypt_token(text, text) IS 'SECURITY DEFINER required for pgcrypto access. Restricted to authenticated users only.';