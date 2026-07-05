// Validasi & sanitasi input sisi client.
// Catatan: ini lapisan UX tambahan — proteksi utama tetap di RLS/DB (lihat Tahap 2).

export function sanitizeText(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
}

export function isValidWhatsapp(value) {
  const cleaned = String(value || '').replace(/[\s-]/g, '');
  return /^(\+62|62|0)8[1-9][0-9]{6,10}$/.test(cleaned);
}

export function isRequired(value) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

export function isPositiveNumber(value) {
  const num = Number(value);
  return !Number.isNaN(num) && num > 0;
}

export function validateCheckoutForm({ name, whatsapp, address }) {
  const errors = {};
  if (!isRequired(name)) errors.name = 'Nama wajib diisi';
  if (!isValidWhatsapp(whatsapp)) errors.whatsapp = 'Nomor WhatsApp tidak valid';
  if (!isRequired(address)) errors.address = 'Alamat pengiriman wajib diisi';
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateProductForm({ name, base_price, stock }) {
  const errors = {};
  if (!isRequired(name)) errors.name = 'Nama produk wajib diisi';
  if (!isPositiveNumber(base_price)) errors.base_price = 'Harga dasar harus lebih dari 0';
  if (stock === '' || Number(stock) < 0 || Number.isNaN(Number(stock))) errors.stock = 'Stok tidak valid';
  return { isValid: Object.keys(errors).length === 0, errors };
}
