/**
 * Pakistan FBR Digital Invoicing Compliance Platform
 * Excel & CSV Parser & Report Generator
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  ParsedSheetData,
  RawRowData,
  ColumnMappingField,
  ValidationError,
  NormalizedInvoice,
} from '../types/fbr';

/**
 * Authoritative Canonical Target Fields for FBR Compliance
 */
export const CANONICAL_MAPPING_FIELDS: ColumnMappingField[] = [
  // Header / Identification
  {
    targetField: 'invoiceNumber',
    label: 'Invoice Number',
    required: true,
    category: 'header',
    dataType: 'string',
    sampleValues: ['INV-2026-001', 'SI-10492', 'TX-9021'],
    description: 'Unique internal sequence or tax invoice number.',
  },
  {
    targetField: 'invoiceDate',
    label: 'Invoice Date',
    required: true,
    category: 'header',
    dataType: 'date',
    sampleValues: ['2026-10-01', '01/10/2026', '2026/10/01'],
    description: 'Date of supply or issuance (YYYY-MM-DD format preferred).',
  },
  {
    targetField: 'invoiceType',
    label: 'Invoice Type / Document Type',
    required: false,
    category: 'header',
    dataType: 'string',
    sampleValues: ['Sales', 'Standard', 'Debit Note', 'Credit Note', 'Export'],
    description: 'Type of supply document. Defaults to Standard Sales Invoice.',
  },
  {
    targetField: 'referenceNumber',
    label: 'Reference Invoice Number',
    required: false,
    category: 'header',
    dataType: 'string',
    sampleValues: ['INV-2026-001-ORIG', 'SI-1002'],
    description: 'Required if Credit Note or Debit Note referencing earlier supply.',
  },

  // Seller Information (Can be populated from Workspace Profile or overridden)
  {
    targetField: 'sellerNTN',
    label: 'Seller NTN',
    required: true,
    category: 'seller',
    dataType: 'string',
    sampleValues: ['1234567-8', '2948123-4'],
    description: 'Seller 7-digit National Tax Number.',
  },
  {
    targetField: 'sellerSTRN',
    label: 'Seller STRN',
    required: false,
    category: 'seller',
    dataType: 'string',
    sampleValues: ['17-00-1234-567-89', '03-01-9999-888-77'],
    description: 'Seller Sales Tax Registration Number.',
  },
  {
    targetField: 'sellerName',
    label: 'Seller Business Name',
    required: true,
    category: 'seller',
    dataType: 'string',
    sampleValues: ['Registered Seller Legal Name'],
    description: 'Registered business name of the seller.',
  },

  // Buyer Information
  {
    targetField: 'buyerName',
    label: 'Buyer Name / Customer Name',
    required: true,
    category: 'buyer',
    dataType: 'string',
    sampleValues: ['Purchasing Entity / Customer Name'],
    description: 'Name of the purchasing entity or consumer.',
  },
  {
    targetField: 'buyerNTN',
    label: 'Buyer NTN',
    required: false,
    category: 'buyer',
    dataType: 'string',
    sampleValues: ['7654321-0', '8192341-2'],
    description: 'Mandatory if buyer is a registered business/taxpayer.',
  },
  {
    targetField: 'buyerCNIC',
    label: 'Buyer CNIC',
    required: false,
    category: 'buyer',
    dataType: 'string',
    sampleValues: ['42101-1234567-1', '35202-9876543-3', '4210112345671'],
    description: '13-digit National ID (required for high-value unregistered B2B).',
  },
  {
    targetField: 'buyerSTRN',
    label: 'Buyer STRN',
    required: false,
    category: 'buyer',
    dataType: 'string',
    sampleValues: ['17-00-5555-444-33'],
    description: 'Buyer Sales Tax Registration Number if available.',
  },
  {
    targetField: 'buyerType',
    label: 'Buyer Classification',
    required: false,
    category: 'buyer',
    dataType: 'string',
    sampleValues: ['Registered', 'Unregistered', 'End Consumer'],
    description: 'Determines whether 3% further tax applies.',
  },
  {
    targetField: 'buyerAddress',
    label: 'Buyer Address / City',
    required: false,
    category: 'buyer',
    dataType: 'string',
    sampleValues: ['Registered Commercial / Industrial Address'],
    description: 'Physical or registered address of the buyer.',
  },

  // Line Item Details
  {
    targetField: 'itemCode',
    label: 'Item Code / SKU',
    required: false,
    category: 'item',
    dataType: 'string',
    sampleValues: ['SKU-1002', 'COT-YRN-40', 'IT-LIC-01'],
    description: 'Internal product or service identifier.',
  },
  {
    targetField: 'hsCode',
    label: 'Pakistan Customs HS Code',
    required: true,
    category: 'item',
    dataType: 'string',
    sampleValues: ['5208.1100', '8471.3000', '3004.9099'],
    description: '8-digit Harmonized Tariff Classification Code.',
  },
  {
    targetField: 'description',
    label: 'Goods / Service Description',
    required: true,
    category: 'item',
    dataType: 'string',
    sampleValues: ['100% Combed Cotton Yarn 40s Count', 'Server Hardware Appliance'],
    description: 'Clear commercial description of the supplied item.',
  },
  {
    targetField: 'uom',
    label: 'Unit of Measure (UOM)',
    required: true,
    category: 'item',
    dataType: 'string',
    sampleValues: ['KGS', 'PCS', 'MTR', 'LTR', 'PKT', 'NOS'],
    description: 'Standard unit of measurement (KGS, PCS, MTR, etc.).',
  },
  {
    targetField: 'quantity',
    label: 'Quantity',
    required: true,
    category: 'item',
    dataType: 'number',
    sampleValues: ['100', '25.5', '1'],
    description: 'Billed quantity (must be positive for sales invoices).',
  },
  {
    targetField: 'unitPrice',
    label: 'Unit Price / Rate (Excl. Tax)',
    required: true,
    category: 'item',
    dataType: 'number',
    sampleValues: ['1250.00', '850.50', '45000.00'],
    description: 'Unit selling price exclusive of sales tax.',
  },
  {
    targetField: 'discount',
    label: 'Discount / Trade Rebate',
    required: false,
    category: 'item',
    dataType: 'number',
    sampleValues: ['0.00', '500.00', '50.00'],
    description: 'Line item discount deduction before calculating sales tax.',
  },

  // Taxes
  {
    targetField: 'salesTaxRate',
    label: 'Sales Tax Rate (%)',
    required: true,
    category: 'tax',
    dataType: 'number',
    sampleValues: ['18', '18.0', '0', '1', '15'],
    description: 'Applicable standard or schedule sales tax percentage (e.g. 18%).',
  },
  {
    targetField: 'salesTaxAmount',
    label: 'Sales Tax Amount (PKR)',
    required: false,
    category: 'tax',
    dataType: 'number',
    sampleValues: ['2250.00', '15309.00'],
    description: 'Computed standard sales tax amount.',
  },
  {
    targetField: 'furtherTaxRate',
    label: 'Further Tax Rate (%)',
    required: false,
    category: 'tax',
    dataType: 'number',
    sampleValues: ['3', '3.0', '0'],
    description: '3% Further Tax rate for unregistered buyers under Sec 3(1A).',
  },
  {
    targetField: 'furtherTaxAmount',
    label: 'Further Tax Amount (PKR)',
    required: false,
    category: 'tax',
    dataType: 'number',
    sampleValues: ['375.00', '0.00'],
    description: 'Computed 3% further tax amount.',
  },
  {
    targetField: 'totalAmount',
    label: 'Total Invoice / Line Value (PKR)',
    required: false,
    category: 'tax',
    dataType: 'number',
    sampleValues: ['14750.00', '100000.00'],
    description: 'Gross line amount including all taxes.',
  },
  {
    targetField: 'paymentMode',
    label: 'Payment Method',
    required: false,
    category: 'payment',
    dataType: 'string',
    sampleValues: ['Bank Transfer', 'Cash', 'Cheque', 'Credit Card'],
    description: 'Form of payment.',
  },
];

/**
 * Parse an Excel or CSV file buffer/arrayBuffer into worksheets and rows
 */
export async function parseExcelOrCsvFile(file: File): Promise<ParsedSheetData[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    const text = await file.text();
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: 'greedy',
        dynamicTyping: true,
        complete: (results) => {
          const headers = (results.meta.fields || []).map((h) => h.trim());
          const rows = results.data as RawRowData[];
          resolve([
            {
              sheetName: 'Sheet1',
              headers,
              rows,
              totalRows: rows.length,
            },
          ]);
        },
        error: (error: unknown) => reject(error),
      });
    });
  }

  // Excel binary parsing (XLSX, XLS)
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, cellNF: false });

  const resultSheets: ParsedSheetData[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    // Convert to JSON with headers
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      raw: false,
      dateNF: 'yyyy-mm-dd',
      defval: '',
    });

    if (rawRows.length > 0) {
      const headers = Object.keys(rawRows[0] || {}).map((h) => h.trim());
      resultSheets.push({
        sheetName,
        headers,
        rows: rawRows as RawRowData[],
        totalRows: rawRows.length,
      });
    }
  });

  return resultSheets;
}

/**
 * Auto-suggest column mappings based on fuzzy header matching
 */
export function autoSuggestColumnMapping(sheetHeaders: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  const fieldPatterns: Record<string, string[]> = {
    invoiceNumber: ['invoice no', 'invoice_no', 'invoicenumber', 'inv_no', 'bill_no', 'doc_num', 'invoice #', 'voucherno'],
    invoiceDate: ['invoice date', 'inv_date', 'date', 'bill_date', 'invoicedate', 'doc_date', 'posting_date'],
    invoiceType: ['invoice type', 'inv_type', 'doc_type', 'type', 'transaction_type'],
    referenceNumber: ['reference no', 'ref_no', 'original_invoice', 'original_inv', 'against_invoice'],
    sellerNTN: ['seller ntn', 'seller_ntn', 'supplier_ntn', 'company_ntn', 'our_ntn'],
    sellerSTRN: ['seller strn', 'seller_strn', 'supplier_strn', 'company_strn'],
    sellerName: ['seller name', 'seller_name', 'company_name', 'supplier_name'],
    buyerName: ['buyer name', 'buyer_name', 'customer_name', 'client_name', 'party_name', 'customer', 'buyer'],
    buyerNTN: ['buyer ntn', 'buyer_ntn', 'customer_ntn', 'client_ntn', 'party_ntn', 'ntn'],
    buyerCNIC: ['buyer cnic', 'buyer_cnic', 'customer_cnic', 'cnic', 'nic', 'national_id'],
    buyerSTRN: ['buyer strn', 'buyer_strn', 'customer_strn', 'client_strn', 'strn'],
    buyerType: ['buyer type', 'customer_type', 'registration_status', 'party_type', 'tax_status'],
    buyerAddress: ['buyer address', 'customer_address', 'address', 'location', 'city'],
    itemCode: ['item code', 'item_code', 'sku', 'product_code', 'material_code', 'item_no'],
    hsCode: ['hs code', 'hs_code', 'pct_code', 'tariff_code', 'hscode', 'customs_code'],
    description: ['description', 'item description', 'product description', 'item_name', 'product_name', 'goods_desc', 'details'],
    uom: ['uom', 'unit', 'unit of measure', 'qty_unit', 'measurement_unit'],
    quantity: ['quantity', 'qty', 'billed_qty', 'units', 'count'],
    unitPrice: ['unit price', 'unit_price', 'rate', 'price', 'unit_rate', 'price_excl_tax', 'rate_excl_tax'],
    discount: ['discount', 'discount_amount', 'trade_discount', 'rebate', 'disc'],
    salesTaxRate: ['sales tax rate', 'sales_tax_rate', 'tax_rate', 'gst_rate', 'stax_rate', 'vat_rate', 'tax %'],
    salesTaxAmount: ['sales tax amount', 'sales_tax_amount', 'tax_amount', 'gst_amount', 'stax_amount', 'tax_val'],
    furtherTaxRate: ['further tax rate', 'further_tax_rate', 'further_rate', 'extra_tax_rate'],
    furtherTaxAmount: ['further tax amount', 'further_tax_amount', 'further_tax', 'further_amt'],
    totalAmount: ['total amount', 'total', 'gross_total', 'net_amount', 'invoice_amount', 'line_total', 'total_value'],
    paymentMode: ['payment mode', 'payment_method', 'pay_mode', 'terms'],
  };

  CANONICAL_MAPPING_FIELDS.forEach((fieldDef) => {
    const target = fieldDef.targetField;
    const patterns = fieldPatterns[target] || [target.toLowerCase()];

    // Look for exact or fuzzy pattern match
    for (const header of sheetHeaders) {
      const normalizedHeader = header.toLowerCase().replace(/[_\s-]+/g, ' ').trim();
      const directMatch = patterns.some((p) => {
        const normP = p.toLowerCase().replace(/[_\s-]+/g, ' ').trim();
        return normalizedHeader === normP || normalizedHeader.includes(normP) || normP.includes(normalizedHeader);
      });

      if (directMatch) {
        mapping[target] = header;
        break;
      }
    }
  });

  return mapping;
}

/**
 * Generate a downloadable standard compliant FBR Excel Template
 */
export function generateStandardFBRExcelTemplate(): Uint8Array {
  const headers = [
    'Invoice Number',
    'Invoice Date (YYYY-MM-DD)',
    'Invoice Type',
    'Reference Number',
    'Buyer Name',
    'Buyer NTN',
    'Buyer CNIC',
    'Buyer STRN',
    'Buyer Type',
    'Buyer Address',
    'Item Code / SKU',
    'HS Code (8-Digit)',
    'Item Description',
    'UOM',
    'Quantity',
    'Unit Price Excl Tax (PKR)',
    'Discount (PKR)',
    'Sales Tax Rate (%)',
    'Further Tax Rate (%)',
    'Payment Mode',
  ];

  // Clean template with zero test records
  const sampleRows: any[][] = [];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Set column widths
  ws['!cols'] = [
    { wch: 16 }, // Invoice Number
    { wch: 16 }, // Invoice Date
    { wch: 14 }, // Invoice Type
    { wch: 16 }, // Ref Number
    { wch: 26 }, // Buyer Name
    { wch: 14 }, // Buyer NTN
    { wch: 18 }, // Buyer CNIC
    { wch: 18 }, // Buyer STRN
    { wch: 14 }, // Buyer Type
    { wch: 32 }, // Buyer Address
    { wch: 14 }, // Item Code
    { wch: 18 }, // HS Code
    { wch: 36 }, // Description
    { wch: 10 }, // UOM
    { wch: 12 }, // Qty
    { wch: 22 }, // Unit Price
    { wch: 14 }, // Discount
    { wch: 18 }, // Sales Tax Rate
    { wch: 18 }, // Further Tax Rate
    { wch: 18 }, // Payment Mode
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'FBR_Invoices_Template');

  // Instructions Sheet
  const instructions = [
    ['Pakistan FBR Digital Invoicing Standard Upload Template', ''],
    ['Version:', '2026.1 - Official Taxpayer Compliance Adapter'],
    ['', ''],
    ['Field Guidelines:', ''],
    ['1. Invoice Number:', 'Multi-item invoices can share the same Invoice Number across consecutive rows.'],
    ['2. Buyer NTN:', 'Mandatory for Registered buyers (7 digits + check digit or 8 digits).'],
    ['3. Buyer CNIC:', '13 digits without dashes. Required for high-value B2B transactions to unregistered buyers.'],
    ['4. HS Code:', 'Standard 8-digit Pakistan Customs tariff classification (e.g. 5208.1100).'],
    ['5. Sales Tax Rate:', 'Standard sales tax rate in Pakistan is 18%. Zero-rated is 0%.'],
    ['6. Further Tax:', '3% Further Tax applies automatically under Section 3(1A) for supplies to Unregistered persons.'],
  ];
  const wsInst = XLSX.utils.aoa_to_sheet(instructions);
  XLSX.utils.book_append_sheet(wb, wsInst, 'Instructions');

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(out);
}

/**
 * Generate a comprehensive Validation Error Report in Excel format
 */
export function generateErrorReportExcel(invoicesWithErrors: NormalizedInvoice[]): Uint8Array {
  const errorRows: Array<Record<string, unknown>> = [];

  invoicesWithErrors.forEach((inv) => {
    if (inv.validationErrors && inv.validationErrors.length > 0) {
      inv.validationErrors.forEach((err) => {
        errorRows.push({
          'Invoice Number': inv.invoiceNumber,
          'Invoice Date': inv.invoiceDate,
          'Buyer Name': inv.buyer?.name || 'N/A',
          'Severity': err.severity,
          'Category': err.category,
          'Error Code': err.errorCode,
          'Field / Line': err.field + (err.row ? ` (Row ${err.row})` : ''),
          'Error Description': err.description,
          'Suggested Correction': err.suggestedCorrection,
          'FBR Rule / Legal Reference': err.validationRule,
        });
      });
    }
  });

  const ws = XLSX.utils.json_to_sheet(errorRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Validation_Errors');

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(out);
}
