import { supabase, isSupabaseConfigured } from '../../config/supabaseClient.js';
import { createStore } from '../store/createStore.js';

export const authStore = createStore({ user: null, profile: null, loading: true });

export async function initAuth() {
  if (!isSupabaseConfigured) {
    authStore.setState({ user: null, profile: null, loading: false });
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    await loadProfile(session.user);
  } else {
    authStore.setState({ loading: false });
  }

  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      await loadProfile(session.user);
    } else {
      authStore.setState({ user: null, profile: null, loading: false });
    }
  });
}

async function loadProfile(authUser) {
  const { data: profile, error } = await supabase
    .from('users')
    .select('*, roles(name), sellers(*)')
    .eq('id', authUser.id)
    .single();

  if (error) {
    console.error('[authService] Gagal memuat profil:', error.message);
  }

  authStore.setState({ user: authUser, profile: profile || null, loading: false });
  return profile || null;
}

export async function signInWithPassword(email, password, captchaToken) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase belum dikonfigurasi. Lihat .env.example.');
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: captchaToken ? { captchaToken } : undefined,
  });
  if (error) throw error;

  // PENTING: tunggu profil (termasuk role) selesai dimuat sebelum resolve.
  // Tanpa ini, kode pemanggil (loginView) akan langsung pindah rute
  // (mis. ke #/admin) sebelum authStore tahu role user, sehingga guard rute
  // melempar balik ke halaman login walau login sudah berhasil.
  if (data.user) {
    await loadProfile(data.user);
  }

  return data;
}

export async function signInWithUsername(username, password, captchaToken) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase belum dikonfigurasi. Lihat .env.example.');
  }
  // Supabase Auth berbasis email, jadi kita cari dulu email dari username
  // lewat RPC (lihat migrasi 0006_username_login.sql), baru login.
  const { data: email, error: lookupError } = await supabase.rpc('rpc_get_email_by_username', {
    p_username: username,
  });
  if (lookupError) throw lookupError;
  if (!email) throw new Error('Username tidak ditemukan.');

  return signInWithPassword(email, password, captchaToken);
}

export async function signUpSeller({ username, email, password, fullName, businessName, captchaToken }) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase belum dikonfigurasi. Lihat .env.example.');
  }
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: captchaToken ? { captchaToken } : undefined,
  });
  if (authError) throw authError;

  const userId = authData.user?.id;
  if (!userId) throw new Error('Registrasi gagal: user ID tidak ditemukan.');

  const { data: sellerRole } = await supabase.from('roles').select('id').eq('name', 'seller').single();

  // Upsert (bukan insert biasa): trigger `on_auth_user_created` di database
  // sudah otomatis membuat baris users dasar begitu akun auth dibuat, jadi di
  // sini kita cukup lengkapi/menimpa dengan data pendaftaran yang sebenarnya.
  const { error: userError } = await supabase.from('users').upsert({
    id: userId,
    role_id: sellerRole?.id,
    full_name: fullName,
    email,
    username,
  });
  if (userError) throw userError;

  const { error: sellerError } = await supabase.from('sellers').insert({
    user_id: userId,
    business_name: businessName,
    verification_status: 'pending',
  });
  if (sellerError) throw sellerError;

  return authData;
}

export async function signOut() {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}

export function getCurrentRole() {
  return authStore.getState().profile?.roles?.name || null;
}
