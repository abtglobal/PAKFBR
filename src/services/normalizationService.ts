/**
 * Pakistan FBR Digital Invoicing Compliance Platform
 * Normalization Service
 * 
 * Adapts raw tabular rows (from Excel, CSV, or ERP adapters) into independent
 * internal domain model (NormalizedInvoice) with accurate arithmetic reconciliation.
 */

import {
  RawRowData,
  NormalizedInvoice,
  NormalizedInvoiceItem,
  NormalizedParty,
  Workspace,
} from '../types/fbr';

export function normalizeRawRowsToInvoices(
  rows: RawRowData[],
  mapping: Record<string, string>,
  workspace: Workspace,
  sourceFileName?: string
): NormalizedInvoice[] {
  // Group rows by Invoice Number
  const groupedByInvoiceNumber = new Map<string, RawRowData[]>();

  rows.forEach((row, index) => {
    const rawInvNo = getMappedValue(row, mapping, 'invoiceNumber');
    const invoiceNumber = rawInvNo ? String(rawInvNo).trim() : `UNASSIGNED-${index + 1}`;

    if (!groupedByInvoiceNumber.has(invoiceNumber)) {
      groupedByInvoiceNumber.set(invoiceNumber, []);
    }
    groupedByInvoiceNumber.get(invoiceNumber)!.push(row);
  });

  const normalizedInvoices: NormalizedInvoice[] = [];

  groupedByInvoiceNumber.forEach((invoiceRows, invoiceNumber) => {
    const firstRow = invoiceRows[0];
    const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 1. Invoice Type
    const rawType = getMappedValue(firstRow, mapping, 'invoiceType');
    let invoiceType: NormalizedInvoice['invoiceType'] = 'sales';
    if (rawType) {
      const typeStr = String(rawType).toLowerCase();
      if (typeStr.includes('debit')) invoiceType = 'debit_note';
      else if (typeStr.includes('credit')) invoiceType = 'credit_note';
      else if (typeStr.includes('export')) invoiceType = 'export';
    }

    // 2. Dates
    const rawDate = getMappedValue(firstRow, mapping, 'invoiceDate');
    const invoiceDate = parseStandardDate(rawDate);

    // 3. Reference Number (for debit/credit notes)
    const refNo = getMappedValue(firstRow, mapping, 'referenceNumber');
    const referenceNumber = refNo ? String(refNo).trim() : undefined;

    // 4. Seller Information
    const sellerNTN = getMappedValue(firstRow, mapping, 'sellerNTN') || workspace.profile.ntn;
    const sellerSTRN = getMappedValue(firstRow, mapping, 'sellerSTRN') || workspace.profile.strn;
    const sellerName = getMappedValue(firstRow, mapping, 'sellerName') || workspace.profile.businessName;
    const sellerAddress = workspace.profile.address;
    const sellerCity = workspace.profile.city;
    const sellerProvince = workspace.profile.province;

    const seller: NormalizedParty = {
      name: String(sellerName || 'Registered Taxpayer'),
      ntn: String(sellerNTN || '').trim(),
      strn: String(sellerSTRN || '').trim(),
      type: 'registered_business',
      address: String(sellerAddress || ''),
      city: String(sellerCity || 'Karachi'),
      province: String(sellerProvince || 'Sindh'),
    };

    // 5. Buyer Information
    const rawBuyerName = getMappedValue(firstRow, mapping, 'buyerName');
    const rawBuyerNTN = getMappedValue(firstRow, mapping, 'buyerNTN');
    const rawBuyerCNIC = getMappedValue(firstRow, mapping, 'buyerCNIC');
    const rawBuyerSTRN = getMappedValue(firstRow, mapping, 'buyerSTRN');
    const rawBuyerType = getMappedValue(firstRow, mapping, 'buyerType');
    const rawBuyerAddress = getMappedValue(firstRow, mapping, 'buyerAddress');

    let buyerType: NormalizedParty['type'] = 'registered_business';
    if (rawBuyerType) {
      const bTypeStr = String(rawBuyerType).toLowerCase();
      if (bTypeStr.includes('unregistered')) buyerType = 'unregistered_business';
      else if (bTypeStr.includes('consumer') || bTypeStr.includes('retail')) buyerType = 'end_consumer';
      else if (bTypeStr.includes('export')) buyerType = 'exporter';
    } else {
      // Deduce from NTN presence
      buyerType = rawBuyerNTN && String(rawBuyerNTN).trim() !== '' ? 'registered_business' : 'unregistered_business';
    }

    const buyer: NormalizedParty = {
      name: String(rawBuyerName || 'Unnamed Buyer').trim(),
      ntn: rawBuyerNTN ? String(rawBuyerNTN).trim() : undefined,
      cnic: rawBuyerCNIC ? String(rawBuyerCNIC).trim().replace(/-/g, '') : undefined,
      strn: rawBuyerSTRN ? String(rawBuyerSTRN).trim() : undefined,
      type: buyerType,
      address: String(rawBuyerAddress || 'Address on file'),
      city: 'Karachi',
      province: 'Sindh',
    };

    // 6. Payment Mode
    const rawPayment = getMappedValue(firstRow, mapping, 'paymentMode');
    let paymentMode: NormalizedInvoice['paymentMode'] = 'bank_transfer';
    if (rawPayment) {
      const pStr = String(rawPayment).toLowerCase();
      if (pStr.includes('cash')) paymentMode = 'cash';
      else if (pStr.includes('cheque')) paymentMode = 'cheque';
      else if (pStr.includes('card')) paymentMode = 'credit_card';
      else if (pStr.includes('pay order') || pStr.includes('draft')) paymentMode = 'pay_order';
    }

    // 7. Line Items Normalization
    const items: NormalizedInvoiceItem[] = invoiceRows.map((row, idx) => {
      const itemCode = String(getMappedValue(row, mapping, 'itemCode') || `SKU-${idx + 1}`).trim();
      const hsCode = String(getMappedValue(row, mapping, 'hsCode') || '9999.9999').trim();
      const description = String(getMappedValue(row, mapping, 'description') || `Item ${idx + 1}`).trim();
      const uom = String(getMappedValue(row, mapping, 'uom') || 'PCS').toUpperCase().trim();
      
      const quantity = parseNumber(getMappedValue(row, mapping, 'quantity'), 1);
      const unitPrice = parseNumber(getMappedValue(row, mapping, 'unitPrice'), 0);
      const discount = parseNumber(getMappedValue(row, mapping, 'discount'), 0);

      // Taxable Value
      const taxableValue = (quantity * unitPrice) - discount;

      // Sales Tax Rate (default 18% standard rate if not provided)
      let salesTaxRate = parseNumber(getMappedValue(row, mapping, 'salesTaxRate'), workspace.taxConfig.standardSalesTaxRate);
      if (invoiceType === 'export') {
        salesTaxRate = 0; // 5th schedule zero-rated
      }

      // Provided or calculated sales tax
      let salesTaxAmount = parseNumber(getMappedValue(row, mapping, 'salesTaxAmount'), -1);
      if (salesTaxAmount < 0) {
        salesTaxAmount = (taxableValue * salesTaxRate) / 100;
      }

      // Further Tax Rate (3% for unregistered buyers)
      let furtherTaxRate = parseNumber(getMappedValue(row, mapping, 'furtherTaxRate'), -1);
      if (furtherTaxRate < 0) {
        if (buyer.type === 'unregistered_business' && salesTaxRate > 0 && workspace.taxConfig.enableFurtherTaxForUnregistered) {
          furtherTaxRate = workspace.taxConfig.furtherTaxRate || 3;
        } else {
          furtherTaxRate = 0;
        }
      }

      let furtherTaxAmount = parseNumber(getMappedValue(row, mapping, 'furtherTaxAmount'), -1);
      if (furtherTaxAmount < 0) {
        furtherTaxAmount = (taxableValue * furtherTaxRate) / 100;
      }

      const extraTaxAmount = 0;
      const totalAmount = taxableValue + salesTaxAmount + furtherTaxAmount + extraTaxAmount;

      const isZeroRated = salesTaxRate === 0 && invoiceType === 'export';
      const isExempt = salesTaxRate === 0 && invoiceType !== 'export';

      return {
        id: `item_${Date.now()}_${idx}`,
        itemCode,
        hsCode,
        description,
        uom,
        quantity,
        unitPrice,
        discount,
        taxableValue: round(taxableValue),
        salesTaxRate,
        salesTaxAmount: round(salesTaxAmount),
        furtherTaxRate,
        furtherTaxAmount: round(furtherTaxAmount),
        extraTaxAmount: round(extraTaxAmount),
        totalAmount: round(totalAmount),
        isExempt,
        isZeroRated,
        scheduleReference: isZeroRated ? '5th Schedule' : isExempt ? '6th Schedule Table-1' : undefined,
      };
    });

    // 8. Reconcile Totals
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotalExclTax = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
    const totalTaxableValue = items.reduce((sum, item) => sum + item.taxableValue, 0);
    const totalSalesTax = items.reduce((sum, item) => sum + item.salesTaxAmount, 0);
    const totalFurtherTax = items.reduce((sum, item) => sum + item.furtherTaxAmount, 0);
    const totalExtraTax = items.reduce((sum, item) => sum + item.extraTaxAmount, 0);
    const grandTotal = items.reduce((sum, item) => sum + item.totalAmount, 0);

    const invoice: NormalizedInvoice = {
      id: invoiceId,
      workspaceId: workspace.id,
      invoiceNumber,
      invoiceType,
      invoiceDate,
      referenceNumber,
      seller,
      buyer,
      paymentMode,
      currency: 'PKR',
      exchangeRate: 1,
      items,
      summary: {
        totalQuantity: round(totalQuantity),
        subtotalExclTax: round(subtotalExclTax),
        totalDiscount: round(totalDiscount),
        totalTaxableValue: round(totalTaxableValue),
        totalSalesTax: round(totalSalesTax),
        totalFurtherTax: round(totalFurtherTax),
        totalExtraTax: round(totalExtraTax),
        grandTotal: round(grandTotal),
      },
      status: 'DRAFT',
      validationStatus: 'unvalidated',
      validationErrors: [],
      auditTrail: [
        {
          id: `audit_${Date.now()}_1`,
          workspaceId: workspace.id,
          timestamp: new Date().toISOString(),
          userId: 'usr_current',
          userName: 'Tax Operator',
          action: 'INVOICE_IMPORTED',
          invoiceId,
          invoiceNumber,
          details: `Imported from ${sourceFileName || 'Excel/CSV source'} with ${items.length} line item(s).`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: sourceFileName ? 'excel_import' : 'manual_entry',
      sourceFile: sourceFileName,
    };

    normalizedInvoices.push(invoice);
  });

  return normalizedInvoices;
}

// Helpers
function getMappedValue(row: RawRowData, mapping: Record<string, string>, targetField: string): unknown {
  const sourceHeader = mapping[targetField];
  if (!sourceHeader) return undefined;
  return row[sourceHeader];
}

function parseNumber(val: unknown, fallback: number): number {
  if (val === null || val === undefined || val === '') return fallback;
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, '').trim());
  return isNaN(num) ? fallback : num;
}

function round(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

function parseStandardDate(val: unknown): string {
  if (!val) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  
  // Try matching ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  // Try parsing with native Date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return str;
}
