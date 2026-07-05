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
