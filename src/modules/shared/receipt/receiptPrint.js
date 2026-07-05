import { renderThermalReceipt, renderA4Receipt } from './receiptTemplate.js';

/**
 * Mencetak nota sesuai mode yang dipilih.
 * @param {'thermal58'|'thermal80'|'a4'} mode
 */
export function printReceipt(order, seller, mode = 'thermal58') {
  let printArea = document.getElementById('receipt-print-area');
  if (!printArea) {
    printArea = document.createElement('div');
    printArea.id = 'receipt-print-area';
    document.body.appendChild(printArea);
  }

  printArea.innerHTML = mode === 'a4'
    ? renderA4Receipt(order, seller)
    : renderThermalReceipt(order, seller);

  document.body.classList.remove('print-thermal-58', 'print-thermal-80', 'print-a4');
  document.body.classList.add(mode === 'a4' ? 'print-a4' : mode === 'thermal80' ? 'print-thermal-80' : 'print-thermal-58');

  window.print();
}
