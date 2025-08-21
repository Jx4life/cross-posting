-- Fix permissions for encryption functions to work in queries
-- Grant to postgres role for administrative access

GRANT EXECUTE ON FUNCTION encrypt_token(text, text) TO postgres;
GRANT EXECUTE ON FUNCTION decrypt_token(text, text) TO postgres;

-- Also ensure public can access for general use
GRANT EXECUTE ON FUNCTION encrypt_token(text, text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION decrypt_token(text, text) TO PUBLIC;

-- Create a simple test function to verify encryption is working
CREATE OR REPLACE FUNCTION test_encryption()
RETURNS TABLE(
    test_name text,
    original_text text,
    encrypted_text text,
    decrypted_text text,
    encryption_working boolean
) AS $$
DECLARE
    test_string text := 'test_token_12345';
    encryption_key text := 'test_key_67890';
    encrypted text;
    decrypted text;
BEGIN
    -- Test encryption
    SELECT encrypt_token(test_string, encryption_key) INTO encrypted;
    
    -- Test decryption  
    SELECT decrypt_token(encrypted, encryption_key) INTO decrypted;
    
    RETURN QUERY SELECT 
        'Encryption Test'::text,
        test_string,
        encrypted,
        decrypted,
        (decrypted = test_string AND encrypted != test_string)::boolean;
END;
$$ LANGUAGE plpgsql;