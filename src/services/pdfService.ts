import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { NormalizedInvoice, Workspace } from '../types/fbr';

// Convert number to Pakistani Rupees in words
function numberToRupeesWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numString = Math.floor(num).toString();
  if (numString.length > 9) return 'PKR ' + num.toFixed(2);

  const n = ('000000000' + numString).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return 'PKR ' + num.toFixed(2);

  let str = '';
  str += Number(n[1]) !== 0 ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += Number(n[2]) !== 0 ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += Number(n[3]) !== 0 ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += Number(n[4]) !== 0 ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str += Number(n[5]) !== 0 ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';

  const paise = Math.round((num - Math.floor(num)) * 100);
  const paiseStr = paise > 0 ? ` and ${paise}/100 Paisa` : '';

  return str.trim() + ' Rupees' + paiseStr + ' Only';
}

/**
 * Builds a single invoice page or adds to an existing jsPDF document
 */
async function buildInvoicePage(
  doc: jsPDF,
  invoice: NormalizedInvoice,
  workspace: Workspace,
  isNewPage: boolean = false
) {
  if (isNewPage) {
    doc.addPage();
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Bar (Deep Slate / Emerald theme)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, 12, pageWidth - margin * 2, 28, 'F');

  // Title on Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const sellerName = (invoice.seller.name || workspace.profile.businessName || 'TAXPAYER ENTITY').toUpperCase();
  doc.text(sellerName, margin + 4, 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  const sellerAddr = [
    invoice.seller.address || workspace.profile.address,
    invoice.seller.city || workspace.profile.city,
    invoice.seller.province || workspace.profile.province
  ].filter(Boolean).join(', ') || 'Address on file';
  doc.text(sellerAddr, margin + 4, 27);

  doc.setFont('helvetica', 'bold');
  doc.text(`NTN: ${invoice.seller.ntn || workspace.profile.ntn || 'N/A'}    STRN: ${invoice.seller.strn || workspace.profile.strn || 'N/A'}`, margin + 4, 34);

  // Right Side Header Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text('SALES TAX INVOICE', pageWidth - margin - 4, 21, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, pageWidth - margin - 4, 27, { align: 'right' });
  doc.text(`Date: ${invoice.invoiceDate}   |   POS ID: ${workspace.fbrConfig.posId || 'POS-01'}`, pageWidth - margin - 4, 34, { align: 'right' });

  // Buyer Info Card & Invoice Metadata
  const buyerBoxY = 44;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, buyerBoxY, pageWidth - margin * 2, 24, 2, 2, 'FD');

  // Left side: Buyer
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO / BUYER DETAILS', margin + 4, buyerBoxY + 5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.buyer.name || 'Unregistered Customer', margin + 4, buyerBoxY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const buyerAddress = [invoice.buyer.address, invoice.buyer.city, invoice.buyer.province].filter(Boolean).join(', ');
  doc.text(buyerAddress || 'Address on file', margin + 4, buyerBoxY + 16);
  doc.text(`Buyer Status: ${(invoice.buyer.type || 'unregistered_consumer').toUpperCase().replace('_', ' ')}`, margin + 4, buyerBoxY + 21);

  // Right side: Buyer Tax IDs
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`Buyer NTN:  ${invoice.buyer.ntn || 'N/A'}`, pageWidth / 2 + 10, buyerBoxY + 9);
  doc.text(`Buyer CNIC: ${invoice.buyer.cnic || 'N/A'}`, pageWidth / 2 + 10, buyerBoxY + 15);
  const fbrStatus = invoice.status === 'ACCEPTED' ? 'FBR ACCEPTED (DIGITAL IRN ISSUED)' : `STATUS: ${invoice.status}`;
  doc.setFont('helvetica', 'bold');
  if (invoice.status === 'ACCEPTED') {
    doc.setTextColor(16, 185, 129); // emerald-600
  } else {
    doc.setTextColor(100, 116, 139);
  }
  doc.text(fbrStatus, pageWidth / 2 + 10, buyerBoxY + 21);

  // Table of Items
  const tableStartY = buyerBoxY + 28;

  const tableBody = invoice.items.map((it, idx) => [
    (idx + 1).toString(),
    it.description || 'General Goods',
    it.hsCode || '-',
    it.uom || 'Unit',
    it.quantity.toString(),
    it.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    it.taxableValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    `${it.salesTaxRate || 18}%`,
    it.salesTaxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    (it.furtherTaxAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    it.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  ]);

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin },
    head: [[
      '#',
      'Description',
      'HS Code',
      'UOM',
      'Qty',
      'Unit Price',
      'Taxable Value',
      'ST %',
      'Sales Tax',
      'Further Tax',
      'Total (PKR)',
    ]],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2.5,
    },
    styles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 42 },
      2: { cellWidth: 18, font: 'courier' },
      3: { halign: 'center', cellWidth: 12 },
      4: { halign: 'right', cellWidth: 10 },
      5: { halign: 'right', cellWidth: 18 },
      6: { halign: 'right', cellWidth: 18 },
      7: { halign: 'center', cellWidth: 10 },
      8: { halign: 'right', cellWidth: 18 },
      9: { halign: 'right', cellWidth: 16 },
      10: { halign: 'right', cellWidth: 20, fontStyle: 'bold' },
    },
  });

  // Position after table
  const finalY = (doc as any).lastAutoTable?.finalY || 140;

  // Calculation & Totals Block
  const totalsY = finalY + 4;
  const totalsBoxWidth = 84;
  const totalsBoxX = pageWidth - margin - totalsBoxWidth;

  // Summary box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(totalsBoxX, totalsY, totalsBoxWidth, 34, 1.5, 1.5, 'FD');

  const addTotalLine = (label: string, value: string, yPos: number, isBold: boolean = false, textColor = [51, 65, 85]) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 8.5 : 7.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(label, totalsBoxX + 3, yPos);
    doc.text(value, pageWidth - margin - 3, yPos, { align: 'right' });
  };

  addTotalLine('Gross Value (Excl. Tax):', `PKR ${invoice.summary.subtotalExclTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalsY + 6);
  if (invoice.summary.totalDiscount > 0) {
    addTotalLine('Trade Discount:', `- PKR ${invoice.summary.totalDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalsY + 11, false, [225, 29, 72]);
  }
  addTotalLine('Total Taxable Value:', `PKR ${invoice.summary.totalTaxableValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalsY + 16, true);
  addTotalLine('Sales Tax (18% ST Act):', `PKR ${invoice.summary.totalSalesTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalsY + 21, false, [16, 185, 129]);
  
  if (invoice.summary.totalFurtherTax > 0) {
    addTotalLine('Further Tax (3% Sec 3(1A)):', `PKR ${invoice.summary.totalFurtherTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalsY + 26, false, [217, 119, 6]);
  }

  // Grand Total bar
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(totalsBoxX, totalsY + 28, totalsBoxWidth, 8, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL AMOUNT (PKR):', totalsBoxX + 3, totalsY + 33.5);
  doc.text(`PKR ${invoice.summary.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 3, totalsY + 33.5, { align: 'right' });

  // Amount in words
  const wordsY = totalsY + 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Amount in Words:', margin, wordsY);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(numberToRupeesWords(invoice.summary.grandTotal), margin + 26, wordsY);

  // QR Code & Statutory FBR Verification Section
  const qrBoxY = totalsY;
  const qrDataText = `FBR-IRN:${invoice.fbrSubmission?.irn || 'PENDING'}|INV:${invoice.invoiceNumber}|SELLER:${invoice.seller.ntn}|BUYER:${invoice.buyer.ntn || invoice.buyer.cnic || 'UNREG'}|DATE:${invoice.invoiceDate}|TOTAL:${invoice.summary.grandTotal}|TAX:${invoice.summary.totalSalesTax}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(qrDataText, {
      margin: 1,
      width: 140,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
    // Draw QR code image
    doc.addImage(qrDataUrl, 'PNG', margin, qrBoxY, 26, 26);
  } catch (err) {
    // Fallback QR outline
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, qrBoxY, 26, 26);
    doc.setFontSize(6);
    doc.text('FBR QR', margin + 7, qrBoxY + 14);
  }

  // QR metadata text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('FBR Digital Invoicing Verification', margin + 30, qrBoxY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const irnText = invoice.fbrSubmission?.irn || 'PK-FBR-PENDING-TRANSMISSION';
  doc.text(`IRN: ${irnText}`, margin + 30, qrBoxY + 10);
  doc.text(`FBR Environment: ${workspace.fbrConfig.environment.toUpperCase()}`, margin + 30, qrBoxY + 15);
  doc.text('Scan via FBR Asaan Tax App or Taxpayer Portal', margin + 30, qrBoxY + 20);

  // Bottom Legal Disclaimer & Signatures
  const footerY = pageHeight - 16;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    'This is a system-generated electronic Sales Tax Invoice issued pursuant to the Sales Tax Act 1990 and Digital Invoicing Rules 2024. No physical signature required.',
    margin,
    footerY
  );
  doc.text(
    `Page ${doc.internal.pages.length - 1} | Generated by PakTax FBR Compliance Gateway`,
    pageWidth - margin,
    footerY,
    { align: 'right' }
  );
}

/**
 * Downloads a single invoice as a crisp, professional PDF file
 */
export async function downloadInvoicePDF(
  invoice: NormalizedInvoice,
  workspace: Workspace
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  await buildInvoicePage(doc, invoice, workspace, false);

  const cleanInvoiceNo = invoice.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Tax_Invoice_${cleanInvoiceNo}.pdf`;
  doc.save(filename);
}

/**
 * Downloads multiple selected invoices in a single consolidated PDF document
 */
export async function downloadBatchInvoicesPDF(
  invoices: NormalizedInvoice[],
  workspace: Workspace
): Promise<void> {
  if (invoices.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  for (let i = 0; i < invoices.length; i++) {
    await buildInvoicePage(doc, invoices[i], workspace, i > 0);
  }

  const filename = `FBR_Tax_Invoices_Batch_${invoices.length}_${Date.now()}.pdf`;
  doc.save(filename);
}

/**
 * Generates a Blob URL for previewing the PDF inside an iframe or new tab
 */
export async function getInvoicePDFBlobUrl(
  invoice: NormalizedInvoice,
  workspace: Workspace
): Promise<string> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  await buildInvoicePage(doc, invoice, workspace, false);
  return doc.output('bloburl').toString();
}
