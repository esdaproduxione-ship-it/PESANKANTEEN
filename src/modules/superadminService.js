import { supabase, isSupabaseConfigured } from '../config/supabaseClient.js';

async function callEdgeFunction(name, payload) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase belum dikonfigurasi.');
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sesi login tidak ditemukan, silakan login ulang.');

  const { data, error } = await supabase.functions.invoke(name, {
    body: payload,
  });

  if (error) {
    // supabase-js membungkus error HTTP non-2xx di sini; coba ambil pesan
    // detail dari body response kalau ada.
    const detail = error.context?.body?.error || error.message;
    throw new Error(detail);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function superadminCreateSeller({ username, email, password, fullName, businessName }) {
  return callEdgeFunction('admin-create-seller', { username, email, password, fullName, businessName });
}

export async function superadminResetPassword(userId, newPassword) {
  return callEdgeFunction('admin-reset-password', { userId, newPassword });
}
