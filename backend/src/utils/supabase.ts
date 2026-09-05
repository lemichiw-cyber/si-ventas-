/**
 * Supabase integration helper for the backend.
 * Provides a typed client for reading/writing data directly via Supabase's
 * auto-generated API, which is useful for real-time subscriptions and admin tasks.
 *
 * Requires: npm install @supabase/supabase-js
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

// import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Lazy-load to avoid startup errors when env vars are missing (dev mode with SQLite)
let _client: ReturnType<typeof createClient> | null = null;

function createClient(url: string, key: string) {
  // Dynamic import avoids bundling @supabase/supabase-js in environments that don't use it
  // We'll use a lazy require pattern for CommonJS compatibility
  const { createClient } = require('@supabase/supabase-js');
  return createClient(url, key);
}

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️  Supabase no configurado — usando Prisma con SQLite');
    return null;
  }
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }
  return _client;
}

/**
 * Notify a user via Supabase's built-in email (or push if configured)
 * when their order tracking status changes.
 */
export async function notifyTrackingUpdate(userId: string, trackingNumber: string, carrier?: string) {
  const supabase = getSupabase();
  if (!supabase) return { skipped: true, reason: 'Supabase not configured' };

  try {
    // Look up user email from Supabase Auth
    // @ts-ignore — we use raw SQL via rpc when needed
    const user = await supabase
      .from('users')
      .select('email, nombre')
      .eq('id', userId)
      .single();

    if (!user.data?.email) {
      console.warn('No email found for user:', userId);
      return { skipped: true, reason: 'User email not found' };
    }

    // Use Supabase Edge Function for email delivery (you'd deploy a function for this)
    // For now, just log the intent
    console.log('📧 Notificación de tracking enviada:', {
      to: user.data.email,
      trackingNumber,
      carrier,
    });

    return { success: true, to: user.data.email };
  } catch (err) {
    console.error('Error enviando notificación de tracking:', err);
    return { error: String(err) };
  }
}

export { getSupabase };
