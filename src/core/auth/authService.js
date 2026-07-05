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
}

export async function signInWithPassword(email, password) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase belum dikonfigurasi. Lihat .env.example.');
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpSeller({ email, password, fullName, businessName }) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase belum dikonfigurasi. Lihat .env.example.');
  }
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) throw authError;

  const userId = authData.user?.id;
  if (!userId) throw new Error('Registrasi gagal: user ID tidak ditemukan.');

  const { data: sellerRole } = await supabase.from('roles').select('id').eq('name', 'seller').single();

  const { error: userError } = await supabase.from('users').insert({
    id: userId,
    role_id: sellerRole?.id,
    full_name: fullName,
    email,
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
