import { SELLER_CONDITION_LABEL } from '../config/constants.js';

/**
 * Merender badge kondisi penjual (🟢/🟡/🔴/⚪) — dipetakan dari kolom
 * condition_status pada view v_seller_status (Tahap 2).
 */
export function renderSellerStatusBadge(conditionStatus) {
  const modifier = {
    no_orders: 'no-orders',
    has_orders: 'has-orders',
    busy: 'busy',
    closed: 'closed',
  }[conditionStatus] || 'closed';

  const label = SELLER_CONDITION_LABEL[conditionStatus] || 'Tidak diketahui';
  return `<span class="badge badge--${modifier}">${label}</span>`;
}

export function renderOrderStatusBadge(status, labelMap) {
  const label = labelMap[status] || status;
  return `<span class="badge badge--has-orders">${label}</span>`;
}
