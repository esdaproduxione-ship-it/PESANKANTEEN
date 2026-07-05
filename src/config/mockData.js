// Data contoh untuk mode demo (dipakai otomatis saat Supabase belum dikonfigurasi)
export const mockSellers = [
  {
    id: 'seller-1',
    business_name: 'Warung Bu Sari',
    logo_url: '',
    is_open: true,
    verification_status: 'approved',
    condition_status: 'busy',
    description: 'Nasi rames & lauk rumahan',
  },
  {
    id: 'seller-2',
    business_name: 'Kedai Kopi Pak Herman',
    logo_url: '',
    is_open: true,
    verification_status: 'approved',
    condition_status: 'has_orders',
    description: 'Kopi, teh, dan gorengan',
  },
  {
    id: 'seller-3',
    business_name: 'Bakso Mas Joko',
    logo_url: '',
    is_open: false,
    verification_status: 'approved',
    condition_status: 'closed',
    description: 'Bakso & mie ayam',
  },
];

export const mockProducts = [
  { id: 'p1', seller_id: 'seller-1', name: 'Nasi Rames Ayam', category: 'Makanan Berat', base_price: 14000, extra_fee: 1000, sell_price: 15000, stock: 20, is_favorite: true },
  { id: 'p2', seller_id: 'seller-1', name: 'Tempe Orek', category: 'Lauk', base_price: 4000, extra_fee: 1000, sell_price: 5000, stock: 15, is_favorite: false },
  { id: 'p3', seller_id: 'seller-2', name: 'Kopi Hitam', category: 'Minuman', base_price: 4000, extra_fee: 1000, sell_price: 5000, stock: 50, is_favorite: true },
  { id: 'p4', seller_id: 'seller-2', name: 'Pisang Goreng', category: 'Camilan', base_price: 6000, extra_fee: 1000, sell_price: 7000, stock: 0, is_favorite: false },
  { id: 'p5', seller_id: 'seller-3', name: 'Bakso Komplit', category: 'Makanan Berat', base_price: 13000, extra_fee: 1000, sell_price: 14000, stock: 10, is_favorite: true },
];

export const mockOrders = [
  {
    id: 'o1',
    order_number: 'DWP-20260704-A1B2C3',
    seller_id: 'seller-1',
    customer_name: 'Rina',
    customer_whatsapp: '081234567890',
    status: 'pending',
    total_amount: 20000,
    items: [{ name: 'Nasi Rames Ayam', qty: 1, price: 15000 }, { name: 'Tempe Orek', qty: 1, price: 5000 }],
    created_at: new Date().toISOString(),
  },
  {
    id: 'o2',
    order_number: 'DWP-20260704-D4E5F6',
    seller_id: 'seller-1',
    customer_name: 'Budi',
    customer_whatsapp: '081298765432',
    status: 'processing',
    total_amount: 15000,
    items: [{ name: 'Nasi Rames Ayam', qty: 1, price: 15000 }],
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
  },
];

export const mockDashboardSummary = {
  total_sellers: 3,
  total_active_products: 4,
  total_orders: 128,
  total_omzet: 4250000,
  orders_today: 18,
  orders_this_month: 312,
};
