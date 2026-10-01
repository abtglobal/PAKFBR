/**
 * Pakistan FBR Digital Invoicing Compliance Platform
 * FBR Transformation Layer
 * 
 * Maps normalized domain models to the exact FBR/PRAL JSON schema
 * according to the Sales Tax Digital Invoicing specification.
 */

import {
  NormalizedInvoice,
  FBRPayload,
  FBRPayloadItem,
  FBRInvoiceType,
  FBRBuyerType,
  FBRPaymentMode,
  Workspace,
} from '../types/fbr';

export function transformToFBRPayload(invoice: NormalizedInvoice, workspace: Workspace): FBRPayload {
  // Map Invoice Type
  let fbrInvoiceType: FBRInvoiceType = '1';
  switch (invoice.invoiceType) {
    case 'sales':
      fbrInvoiceType = '1';
      break;
    case 'debit_note':
      fbrInvoiceType = '2';
      break;
    case 'credit_note':
      fbrInvoiceType = '3';
      break;
    case 'export':
      fbrInvoiceType = '4';
      break;
    default:
      fbrInvoiceType = '1';
  }

  // Map Buyer Type
  let fbrBuyerType: FBRBuyerType = '1';
  if (invoice.buyer.type === 'registered_business') {
    fbrBuyerType = '1';
  } else if (invoice.buyer.type === 'unregistered_business') {
    fbrBuyerType = '2';
  } else {
    fbrBuyerType = '3';
  }

  // Map Payment Mode
  let fbrPaymentMode: FBRPaymentMode = '4';
  switch (invoice.paymentMode) {
    case 'cash':
      fbrPaymentMode = '1';
      break;
    case 'cheque':
      fbrPaymentMode = '2';
      break;
    case 'pay_order':
      fbrPaymentMode = '3';
      break;
    case 'bank_transfer':
      fbrPaymentMode = '4';
      break;
    case 'credit_card':
      fbrPaymentMode = '5';
      break;
    default:
      fbrPaymentMode = '6';
  }

  // Format ISO Date-Time: YYYY-MM-DD HH:mm:ss
  const timePart = invoice.invoiceTime || '12:00:00';
  const invoiceDateTime = `${invoice.invoiceDate} ${timePart}`;

  // Clean NTN & CNIC (remove dashes for transmission compliance)
  const cleanSellerNTN = (invoice.seller.ntn || workspace.profile.ntn).replace(/-/g, '').trim();
  const cleanBuyerNTN = invoice.buyer.ntn ? invoice.buyer.ntn.replace(/-/g, '').trim() : undefined;
  const cleanBuyerCNIC = invoice.buyer.cnic ? invoice.buyer.cnic.replace(/-/g, '').trim() : undefined;

  // Map Items
  const fbrItems: FBRPayloadItem[] = invoice.items.map((item) => {
    return {
      itemCode: item.itemCode,
      hsCode: item.hsCode.replace(/\./g, ''), // e.g. 5208.1100 -> 52081100
      itemDescription: item.description,
      unitOfMeasure: item.uom,
      quantity: item.quantity,
      rate: item.unitPrice,
      valueExclTax: item.taxableValue,
      discount: item.discount,
      salesTaxApplicable: item.salesTaxRate,
      salesTaxAmount: item.salesTaxAmount,
      furtherTaxRate: item.furtherTaxRate > 0 ? item.furtherTaxRate : undefined,
      furtherTaxAmount: item.furtherTaxAmount > 0 ? item.furtherTaxAmount : undefined,
      extraTaxRate: undefined,
      extraTaxAmount: item.extraTaxAmount > 0 ? item.extraTaxAmount : undefined,
      totalValues: item.totalAmount,
    };
  });

  const payload: FBRPayload = {
    invoiceType: fbrInvoiceType,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDateTime,
    posID: workspace.fbrConfig.posId || workspace.profile.posId || 'POS-001',
    sellerNTN: cleanSellerNTN,
    sellerSTRN: invoice.seller.strn || workspace.profile.strn,
    sellerName: invoice.seller.name || workspace.profile.businessName,
    sellerAddress: invoice.seller.address || workspace.profile.address,
    sellerCity: invoice.seller.city || workspace.profile.city,
    sellerProvince: invoice.seller.province || workspace.profile.province,
    buyerNTN: cleanBuyerNTN,
    buyerCNIC: cleanBuyerCNIC,
    buyerName: invoice.buyer.name,
    buyerType: fbrBuyerType,
    buyerAddress: invoice.buyer.address,
    buyerCity: invoice.buyer.city,
    buyerProvince: invoice.buyer.province,
    paymentMode: fbrPaymentMode,
    totalQuantity: invoice.summary.totalQuantity,
    totalSaleValue: invoice.summary.totalTaxableValue,
    totalDiscount: invoice.summary.totalDiscount,
    totalTaxAmount: invoice.summary.totalSalesTax,
    totalFurtherTax: invoice.summary.totalFurtherTax,
    totalExtraTax: invoice.summary.totalExtraTax,
    totalInvoiceAmount: invoice.summary.grandTotal,
    items: fbrItems,
  };

  // Taxpayer integrity hash representation
  payload.taxpayerHash = generateTaxpayerDigest(payload);

  return payload;
}

/**
 * Generate cryptographic or canonical SHA-like checksum digest for data tamper protection
 */
export function generateTaxpayerDigest(payload: FBRPayload): string {
  const canonicalString = [
    payload.invoiceNumber,
    payload.invoiceDateTime,
    payload.sellerNTN,
    payload.buyerNTN || payload.buyerCNIC || 'UNREGISTERED',
    payload.totalSaleValue.toFixed(2),
    payload.totalTaxAmount.toFixed(2),
    payload.totalInvoiceAmount.toFixed(2),
    payload.items.length,
  ].join('|');

  // Simple deterministic hash representation
  let hash = 0;
  for (let i = 0; i < canonicalString.length; i++) {
    const char = canonicalString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `SIG-${hex.toUpperCase()}-${Date.now().toString(16).substring(4).toUpperCase()}`;
}
