// Konstanta aplikasi — dipakai lintas modul agar konsisten
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const ORDER_STATUS_LABEL = {
  pending: 'Menunggu Konfirmasi',
  processing: 'Diproses',
  ready: 'Siap Diambil/Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const SELLER_CONDITION = {
  NO_ORDERS: 'no_orders',
  HAS_ORDERS: 'has_orders',
  BUSY: 'busy',
  CLOSED: 'closed',
};

export const SELLER_CONDITION_LABEL = {
  no_orders: 'Siap Menerima Pesanan',
  has_orders: 'Ada Pesanan',
  busy: 'Sedang Ramai',
  closed: 'Tutup',
};

export const PAYMENT_TYPE = {
  QRIS: 'qris',
  BANK_TRANSFER: 'bank_transfer',
  COD: 'cod',
};

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const DEFAULT_SETTINGS = {
  min_extra_fee: 1000,
  busy_threshold_orders: 5,
  busy_threshold_minutes: 15,
};

export const ROLES = {
  ADMIN: 'admin',
  SELLER: 'seller',
};

export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
