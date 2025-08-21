/**
 * Token encryption utilities for securing access tokens and refresh tokens
 */

import { supabase } from '@/integrations/supabase/client';
import { type Database } from '@/integrations/supabase/types';

type PlatformType = Database["public"]["Enums"]["platform_type"];

// Get encryption key from Supabase secrets
async function getEncryptionKey(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('get-secret', {
    body: { name: 'TOKEN_ENCRYPTION_KEY' }
  });
  
  if (error || !data?.value) {
    throw new Error('Failed to retrieve encryption key');
  }
  
  return data.value;
}

// Simple client-side encryption for additional security layer
function simpleEncrypt(text: string, key: string): string {
  let encrypted = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    encrypted += String.fromCharCode(charCode);
  }
  return btoa(encrypted); // Base64 encode
}

function simpleDecrypt(encryptedText: string, key: string): string {
  const encrypted = atob(encryptedText); // Base64 decode
  let decrypted = '';
  for (let i = 0; i < encrypted.length; i++) {
    const charCode = encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    decrypted += String.fromCharCode(charCode);
  }
  return decrypted;
}

/**
 * Encrypts a token using server-side encryption
 */
export async function encryptToken(token: string): Promise<string> {
  if (!token) return '';
  
  try {
    const encryptionKey = await getEncryptionKey();
    
    // Add client-side encryption layer for additional security
    const clientEncrypted = simpleEncrypt(token, encryptionKey.substring(0, 16));
    
    // Call server-side encryption function
    const { data, error } = await supabase.rpc('encrypt_token', {
      token: clientEncrypted,
      encryption_key: encryptionKey
    });
    
    if (error) {
      console.error('Token encryption failed:', error);
      throw new Error('Failed to encrypt token');
    }
    
    return data;
  } catch (error) {
    console.error('Token encryption error:', error);
    throw error;
  }
}

/**
 * Decrypts a token using server-side decryption
 */
export async function decryptToken(encryptedToken: string): Promise<string> {
  if (!encryptedToken) return '';
  
  try {
    const encryptionKey = await getEncryptionKey();
    
    // Call server-side decryption function
    const { data, error } = await supabase.rpc('decrypt_token', {
      encrypted_token: encryptedToken,
      encryption_key: encryptionKey
    });
    
    if (error) {
      console.error('Token decryption failed:', error);
      throw new Error('Failed to decrypt token');
    }
    
    // Decrypt client-side layer
    const decrypted = simpleDecrypt(data, encryptionKey.substring(0, 16));
    
    return decrypted;
  } catch (error) {
    console.error('Token decryption error:', error);
    throw error;
  }
}

/**
 * Safely stores encrypted tokens in the database
 */
export async function storeEncryptedTokens(
  userId: string,
  platform: PlatformType,
  accessToken: string,
  refreshToken?: string
): Promise<void> {
  try {
    const encryptedAccessToken = await encryptToken(accessToken);
    const encryptedRefreshToken = refreshToken ? await encryptToken(refreshToken) : null;
    
    const { error } = await supabase
      .from('post_configurations')
      .upsert({
        user_id: userId,
        platform,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        is_enabled: true
      });
    
    if (error) {
      console.error('Failed to store encrypted tokens:', error);
      throw error;
    }
    
    console.log(`Successfully stored encrypted tokens for ${platform}`);
  } catch (error) {
    console.error('Error storing encrypted tokens:', error);
    throw error;
  }
}

/**
 * Safely retrieves and decrypts tokens from the database
 */
export async function getDecryptedTokens(
  userId: string,
  platform: PlatformType
): Promise<{ accessToken: string; refreshToken?: string } | null> {
  try {
    const { data, error } = await supabase
      .from('post_configurations')
      .select('access_token, refresh_token')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('is_enabled', true)
      .single();
    
    if (error || !data) {
      console.log(`No tokens found for ${platform}`);
      return null;
    }
    
    const accessToken = data.access_token ? await decryptToken(data.access_token) : '';
    const refreshToken = data.refresh_token ? await decryptToken(data.refresh_token) : undefined;
    
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error retrieving decrypted tokens:', error);
    throw error;
  }
}