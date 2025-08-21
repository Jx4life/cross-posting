-- Grant proper permissions for encryption functions to work with RLS
-- The functions need to be accessible by the anon and authenticated roles

GRANT EXECUTE ON FUNCTION encrypt_token(text, text) TO anon;
GRANT EXECUTE ON FUNCTION decrypt_token(text, text) TO anon;

-- Add a security audit function to check token encryption status
CREATE OR REPLACE FUNCTION audit_token_security()
RETURNS TABLE(
    platform text,
    total_tokens bigint,
    likely_encrypted bigint,
    likely_plaintext bigint,
    security_status text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.platform::text,
        COUNT(*) as total_tokens,
        COUNT(CASE WHEN LENGTH(pc.access_token) < 100 THEN 1 END) as likely_encrypted,
        COUNT(CASE WHEN LENGTH(pc.access_token) >= 100 THEN 1 END) as likely_plaintext,
        CASE 
            WHEN COUNT(CASE WHEN LENGTH(pc.access_token) >= 100 THEN 1 END) > 0 
            THEN 'VULNERABLE - Contains plaintext tokens'
            ELSE 'SECURE - All tokens encrypted'
        END as security_status
    FROM post_configurations pc
    WHERE pc.access_token IS NOT NULL
    GROUP BY pc.platform;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to audit function
GRANT EXECUTE ON FUNCTION audit_token_security() TO authenticated;