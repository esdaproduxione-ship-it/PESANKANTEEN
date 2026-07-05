import { supabase, isSupabaseConfigured } from '../config/supabaseClient.js';
import { mockSellers, mockProducts } from '../config/mockData.js';

export async function fetchSellersWithStatus() {
  if (!isSupabaseConfigured) {
    return mockSellers;
  }
  // Memakai RPC khusus publik (lihat 0003_fix_security_definer_views.sql)
  // — bukan query langsung ke view v_seller_status — karena view tersebut
  // kini menegakkan RLS (security_invoker) dan tidak boleh diakses anon
  // langsung ke tabel `orders`.
  const { data, error } = await supabase.rpc('rpc_get_public_seller_status');
  if (error) throw error;
  return data.map((row) => ({
    id: row.seller_id,
    business_name: row.business_name,
    is_open: row.is_open,
    condition_status: row.condition_status,
  }));
}

export async function fetchProducts({ sellerId, categoryId, search } = {}) {
  if (!isSupabaseConfigured) {
    let results = mockProducts;
    if (sellerId) results = results.filter((p) => p.seller_id === sellerId);
    if (search) results = results.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    return results;
  }

  let query = supabase.from('products').select('*, sellers(business_name)').eq('is_available', true);
  if (sellerId) query = query.eq('seller_id', sellerId);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchSellerProducts(sellerId) {
  if (!isSupabaseConfigured) {
    return mockProducts.filter((p) => p.seller_id === sellerId);
  }
  const { data, error } = await supabase.from('products').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createProduct(product) {
  if (!isSupabaseConfigured) {
    console.info('[productService] Mode demo — produk tidak benar-benar disimpan.', product);
    return { ...product, id: 'demo-' + Date.now() };
  }
  const { data, error } = await supabase.from('products').insert(product).select().single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id, patch) {
  if (!isSupabaseConfigured) {
    console.info('[productService] Mode demo — update tidak benar-benar disimpan.', id, patch);
    return { id, ...patch };
  }
  const { data, error } = await supabase.from('products').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id) {
  if (!isSupabaseConfigured) return true;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
  return true;
}
