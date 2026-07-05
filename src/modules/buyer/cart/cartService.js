import { createStore } from '../../../core/store/createStore.js';

const CART_STORAGE_KEY = 'kantin_dwp_cart';

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export const cartStore = createStore({ items: loadCart() });

cartStore.subscribe((state) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
});

export function addToCart(product) {
  const { items } = cartStore.getState();
  const existing = items.find((i) => i.product_id === product.id);
  let newItems;
  if (existing) {
    newItems = items.map((i) => i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i);
  } else {
    newItems = [...items, {
      product_id: product.id,
      seller_id: product.seller_id,
      name: product.name,
      price: product.sell_price,
      qty: 1,
    }];
  }
  cartStore.setState({ items: newItems });
}

export function updateQty(productId, qty) {
  const { items } = cartStore.getState();
  if (qty <= 0) return removeFromCart(productId);
  cartStore.setState({ items: items.map((i) => i.product_id === productId ? { ...i, qty } : i) });
}

export function removeFromCart(productId) {
  const { items } = cartStore.getState();
  cartStore.setState({ items: items.filter((i) => i.product_id !== productId) });
}

export function clearCart() {
  cartStore.setState({ items: [] });
}

/** Memecah keranjang per penjual (order splitting) saat checkout. */
export function groupCartBySeller() {
  const { items } = cartStore.getState();
  const grouped = {};
  items.forEach((item) => {
    if (!grouped[item.seller_id]) grouped[item.seller_id] = [];
    grouped[item.seller_id].push(item);
  });
  return grouped;
}

export function getCartTotal() {
  return cartStore.getState().items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

export function getCartCount() {
  return cartStore.getState().items.reduce((sum, i) => sum + i.qty, 0);
}
