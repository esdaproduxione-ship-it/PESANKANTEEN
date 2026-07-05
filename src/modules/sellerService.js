import { supabase, isSupabaseConfigured } from '../config/supabaseClient.js';
import { mockSellers } from '../config/mockData.js';

export async function fetchSellerById(sellerId) {
  if (!isSupabaseConfigured) {
    return mockSellers.find((s) => s.id === sellerId) || mockSellers[0];
  }
  const { data, error } = await supabase.from('sellers').select('*').eq('id', sellerId).single();
  if (error) throw error;
  return data;
}

export async function updateSellerProfile(sellerId, patch) {
  if (!isSupabaseConfigured) {
    console.info('[sellerService] Mode demo — profil tidak benar-benar disimpan.', sellerId, patch);
    return { id: sellerId, ...patch };
  }
  const { data, error } = await supabase.from('sellers').update(patch).eq('id', sellerId).select().single();
  if (error) throw error;
  return data;
}

export async function uploadSellerLogo(userId, file) {
  if (!isSupabaseConfigured) {
    console.info('[sellerService] Mode demo — logo tidak benar-benar diunggah.', file?.name);
    return URL.createObjectURL(file); // preview lokal saja untuk mode demo
  }
  if (!file) throw new Error('File tidak ditemukan.');
  if (!file.type.startsWith('image/')) throw new Error('File harus berupa gambar.');
  if (file.size > 2 * 1024 * 1024) throw new Error('Ukuran gambar maksimal 2MB.');

  const ext = file.name.split('.').pop() || 'jpg';
  // Path diawali user_id supaya cocok dengan RLS storage (lihat migrasi 0010).
  const path = `${userId}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('seller-logos')
    .upload(path, file, { upsert: true, cacheControl: '3600' });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('seller-logos').getPublicUrl(path);
  // Tambahkan cache-buster supaya browser tidak menampilkan logo lama dari cache.
  return `${data.publicUrl}?t=${Date.now()}`;
}
