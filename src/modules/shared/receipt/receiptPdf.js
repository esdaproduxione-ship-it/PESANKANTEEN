import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { renderThermalReceipt, renderA4Receipt } from './receiptTemplate.js';

/**
 * Mengunduh nota sebagai file PDF, digenerate langsung dari data order
 * (tidak pernah disimpan sebagai file statis di server).
 */
export async function downloadReceiptPdf(order, seller, mode = 'a4') {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-9999px';
  wrapper.style.background = '#ffffff';
  wrapper.innerHTML = mode === 'a4' ? renderA4Receipt(order, seller) : renderThermalReceipt(order, seller);
  wrapper.style.width = mode === 'a4' ? '210mm' : '58mm';
  document.body.appendChild(wrapper);

  const canvas = await html2canvas(wrapper, { scale: 2, backgroundColor: '#ffffff' });
  const imgData = canvas.toDataURL('image/png');

  const pdf = mode === 'a4'
    ? new jsPDF({ unit: 'mm', format: 'a4' })
    : new jsPDF({ unit: 'mm', format: [58, canvas.height * (58 / canvas.width)] });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(`Nota-${order.order_number}.pdf`);

  document.body.removeChild(wrapper);
}
