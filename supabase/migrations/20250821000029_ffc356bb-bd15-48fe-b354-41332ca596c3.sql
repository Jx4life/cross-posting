-- Ensure pgcrypto extension is properly enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify the extension is working by testing encryption directly
SELECT 
    'Extension Test' as test_type,
    encode(pgp_sym_encrypt('test_message', 'test_key'), 'base64') as encrypted_sample,
    pgp_sym_decrypt(pgp_sym_encrypt('test_message', 'test_key'), 'test_key') as decrypted_sample;