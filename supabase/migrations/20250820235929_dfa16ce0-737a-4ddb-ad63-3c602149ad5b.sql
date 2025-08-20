-- Restore encryption functions that were accidentally removed
-- These are essential for token security

-- Create encryption function with proper security
CREATE OR REPLACE FUNCTION encrypt_token(token text, encryption_key text)
RETURNS text AS $$
BEGIN
  RETURN encode(pgp_sym_encrypt(token, encryption_key), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create decryption function with proper security  
CREATE OR REPLACE FUNCTION decrypt_token(encrypted_token text, encryption_key text)
RETURNS text AS $$
BEGIN
  RETURN pgp_sym_decrypt(decode(encrypted_token, 'base64'), encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure the functions - only authenticated users can use them
REVOKE ALL ON FUNCTION encrypt_token(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION encrypt_token(text, text) TO authenticated;

REVOKE ALL ON FUNCTION decrypt_token(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION decrypt_token(text, text) TO authenticated;

-- Add security documentation
COMMENT ON FUNCTION encrypt_token(text, text) IS 'SECURITY DEFINER required for pgcrypto access. Encrypts social media tokens. Restricted to authenticated users only.';
COMMENT ON FUNCTION decrypt_token(text, text) IS 'SECURITY DEFINER required for pgcrypto access. Decrypts social media tokens. Restricted to authenticated users only.';