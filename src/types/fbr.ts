/**
 * Pakistan FBR Digital Invoicing Compliance Platform
 * Type Definitions
 */

// ==========================================
// 1. FBR / PRAL Official Specification Types
// ==========================================

export type FBRInvoiceType = 
  | '1' // Sales Invoice / Standard
  | '2' // Debit Note
  | '3' // Credit Note
  | '4'; // Export Invoice

export type FBRBuyerType = 
  | '1' // Registered (has NTN/STRN)
  | '2' // Unregistered (CNIC / Walk-in)
  | '3'; // End Consumer / Retail

export type FBRPaymentMode = 
  | '1' // Cash
  | '2' // Cheque
  | '3' // Pay Order / Demand Draft
  | '4' // Online / Direct Bank Transfer
  | '5' // Credit Card / Debit Card
  | '6'; // Mixed / Other

export interface FBRPayloadItem {
  itemCode?: string;
  hsCode: string; // Harmonized System Code (8-digit standard, e.g. 5208.1100)
  itemDescription: string;
  unitOfMeasure: string; // e.g. PCS, KGS, MTR, LTR, PKT, NOS
  quantity: number;
  rate: number; // Unit price excluding tax
  valueExclTax: number;
  discount: number;
  salesTaxApplicable: number; // Tax rate in percentage, e.g. 18.0
  salesTaxAmount: number;
  furtherTaxRate?: number; // E.g. 3.0% for unregistered buyers
  furtherTaxAmount?: number;
  extraTaxRate?: number;
  extraTaxAmount?: number;
  totalValues: number; // Line total including all taxes
}

export interface FBRPayload {
  invoiceType: FBRInvoiceType;
  invoiceNumber: string; // Taxpayer's internal invoice number
  invoiceDateTime: string; // Format: YYYY-MM-DD HH:mm:ss
  posID: number | string; // System / POS / Applet identifier assigned by FBR
  
  sellerNTN: string; // 7 digits + 1 check digit (e.g. 1234567-8 or 1234567)
  sellerSTRN?: string; // Sales Tax Registration Number (e.g. 17-00-1234-567-89)
  sellerName: string;
  sellerAddress: string;
  sellerCity: string;
  sellerProvince: string;
  
  buyerNTN?: string; // If registered buyer
  buyerCNIC?: string; // 13 digits without dashes (e.g. 4210112345671)
  buyerName: string;
  buyerType: FBRBuyerType;
  buyerAddress?: string;
  buyerCity?: string;
  buyerProvince?: string;
  
  paymentMode: FBRPaymentMode;
  totalQuantity: number;
  totalSaleValue: number; // Total value excluding sales tax
  totalDiscount: number;
  totalTaxAmount: number; // Total standard sales tax
  totalFurtherTax: number; // 3% further tax if applicable
  totalExtraTax: number;
  totalInvoiceAmount: number; // Gross invoice amount payable
  
  items: FBRPayloadItem[];
  
  // Taxpayer signature or verification hash if digital signing is configured
  taxpayerHash?: string;
}

// ==========================================
// 2. Normalized Internal Invoice Model
// ==========================================

export interface NormalizedParty {
  name: string;
  ntn?: string;
  cnic?: string;
  strn?: string;
  type: 'registered_business' | 'unregistered_business' | 'end_consumer' | 'exporter';
  address: string;
  city: string;
  province: string;
  email?: string;
  phone?: string;
}

export interface NormalizedInvoiceItem {
  id: string;
  itemCode: string;
  hsCode: string;
  description: string;
  uom: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxableValue: number; // (quantity * unitPrice) - discount
  salesTaxRate: number; // e.g. 18
  salesTaxAmount: number;
  furtherTaxRate: number; // e.g. 3 for unregistered buyers
  furtherTaxAmount: number;
  extraTaxAmount: number;
  totalAmount: number; // taxableValue + salesTaxAmount + furtherTaxAmount + extraTaxAmount
  isExempt: boolean;
  isZeroRated: boolean;
  scheduleReference?: string; // E.g. "5th Schedule", "6th Schedule (Table 1)"
}

export interface NormalizedInvoice {
  id: string;
  workspaceId: string;
  invoiceNumber: string;
  invoiceType: 'sales' | 'debit_note' | 'credit_note' | 'export';
  invoiceDate: string; // YYYY-MM-DD
  invoiceTime?: string; // HH:mm:ss
  dueDate?: string;
  
  seller: NormalizedParty;
  buyer: NormalizedParty;
  
  paymentMode: 'cash' | 'bank_transfer' | 'cheque' | 'pay_order' | 'credit_card' | 'mixed';
  currency: string;
  exchangeRate: number; // 1 for PKR
  
  items: NormalizedInvoiceItem[];
  
  summary: {
    totalQuantity: number;
    subtotalExclTax: number;
    totalDiscount: number;
    totalTaxableValue: number;
    totalSalesTax: number;
    totalFurtherTax: number;
    totalExtraTax: number;
    grandTotal: number;
  };
  
  notes?: string;
  referenceNumber?: string; // For credit/debit notes referring to original invoice
  
  status: InvoiceStatus;
  validationStatus: 'valid' | 'invalid' | 'unvalidated';
  validationErrors: ValidationError[];
  
  fbrSubmission?: FBRSubmissionResult;
  auditTrail: AuditEntry[];
  
  createdAt: string;
  updatedAt: string;
  source: 'excel_import' | 'csv_import' | 'manual_entry' | 'erp_api';
  sourceFile?: string;
  sourceRowIndex?: number;
}

export type InvoiceStatus = 
  | 'DRAFT'
  | 'VALIDATED'
  | 'READY'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'FAILED'
  | 'CANCELLED';

// ==========================================
// 3. Validation Engine Types
// ==========================================

export type RuleSeverity = 'ERROR' | 'WARNING' | 'INFO';

export type RuleCategory = 
  | 'STRUCTURAL'
  | 'TAX_CALCULATION'
  | 'BUSINESS_LOGIC'
  | 'FBR_SPECIFICATION';

export interface ValidationError {
  id: string;
  errorCode: string;
  severity: RuleSeverity;
  category: RuleCategory;
  field: string;
  row?: number;
  invoiceNumber: string;
  description: string;
  suggestedCorrection: string;
  validationRule: string;
  isDismissed?: boolean;
}

export interface ValidationRuleDefinition {
  id: string;
  code: string;
  name: string;
  category: RuleCategory;
  severity: RuleSeverity;
  description: string;
  fbrReference?: string;
  enabled: boolean;
  validate: (invoice: NormalizedInvoice, allInvoices?: NormalizedInvoice[]) => ValidationError[];
}

export interface ValidationSummary {
  totalChecked: number;
  validCount: number;
  invalidCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

// ==========================================
// 4. Excel & CSV Import Types
// ==========================================

export interface RawRowData {
  [columnName: string]: string | number | boolean | null | undefined;
}

export interface ParsedSheetData {
  sheetName: string;
  headers: string[];
  rows: RawRowData[];
  totalRows: number;
}

export interface ColumnMappingField {
  targetField: string;
  label: string;
  required: boolean;
  category: 'header' | 'seller' | 'buyer' | 'item' | 'tax' | 'payment';
  dataType: 'string' | 'number' | 'date' | 'boolean';
  sampleValues?: string[];
  description: string;
}

export interface ColumnMappingConfig {
  id: string;
  workspaceId: string;
  name: string;
  sourceType: 'excel' | 'csv' | 'sap' | 'oracle' | 'odoo' | 'ifs' | 'custom';
  description?: string;
  mapping: Record<string, string>; // internalTargetField -> sourceColumnHeader
  dateFormat: string; // e.g. YYYY-MM-DD, DD/MM/YYYY
  hasHeaderRow: boolean;
  sheetIndexOrName?: string | number;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 5. Submission Adapter & FBR Response
// ==========================================

export type EnvironmentType = 'SANDBOX' | 'STAGING' | 'PRODUCTION' | 'OFFLINE_EXPORT';

export interface FBRSubmissionConfig {
  workspaceId: string;
  environment: EnvironmentType;
  sandboxEndpointUrl: string;
  productionEndpointUrl: string;
  posId: string; // Taxpayer POS identifier
  bearerToken: string;
  apiKey: string;
  digitalCertificateThumbprint?: string;
  timeoutMs: number;
  retryAttempts: number;
  autoValidateBeforeSubmit: boolean;
  generateQRCode: boolean;
  isConfirmedByTaxpayer: boolean; // Indicates explicit taxpayer credential authorization
}

export interface FBRSubmissionRequest {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  timestamp: string;
  environment: EnvironmentType;
  endpointUrl: string;
  payload: FBRPayload;
  headers: Record<string, string>;
}

export interface FBRSubmissionResult {
  id: string;
  submissionId: string;
  timestamp: string;
  status: 'ACCEPTED' | 'REJECTED' | 'FAILED' | 'PENDING';
  httpStatusCode: number;
  fbrInvoiceNumber?: string; // Official FBR assigned invoice number (e.g. FBR-2026-9812457812)
  irn?: string; // Invoice Reference Number
  qrCodeData?: string; // Raw QR verification string or base64
  verificationUrl?: string; // FBR online verification link
  responseCode?: string;
  responseMessage: string;
  errors?: Array<{ code: string; message: string; field?: string }>;
  rawResponse?: string;
  durationMs: number;
}

// ==========================================
// 6. Workspace & Tax Configuration
// ==========================================

export interface TaxRateConfig {
  id: string;
  name: string;
  code: string;
  rate: number;
  type: 'standard' | 'reduced' | 'zero_rated' | 'exempt' | 'further_tax' | 'provincial';
  schedule?: string;
  description: string;
  isDefault?: boolean;
}

export interface HSCodeDefinition {
  hsCode: string;
  description: string;
  defaultUOM: string;
  applicableSalesTaxRate: number;
  furtherTaxApplies: boolean;
  category: string;
}

export interface WorkspaceProfile {
  id: string;
  name: string;
  businessName: string;
  ntn: string;
  strn: string;
  cnic?: string;
  principalActivity: string;
  sector: 'manufacturing' | 'distribution' | 'retail_pos' | 'services' | 'export';
  address: string;
  city: string;
  province: string;
  contactEmail: string;
  contactPhone: string;
  posId: string;
  fbrRegistrationDate?: string;
}

export interface Workspace {
  id: string;
  profile: WorkspaceProfile;
  taxConfig: {
    standardSalesTaxRate: number; // 18%
    furtherTaxRate: number; // 3%
    enableFurtherTaxForUnregistered: boolean;
    defaultCurrency: string;
    provincialTaxAuthority: 'FBR_FEDERAL' | 'SRB' | 'PRA' | 'KPRA' | 'BRA';
  };
  fbrConfig: FBRSubmissionConfig;
  userRole: 'ADMIN' | 'TAX_CONSULTANT' | 'ACCOUNTANT' | 'AUDITOR';
}

// ==========================================
// 7. Audit Trail
// ==========================================

export interface AuditEntry {
  id: string;
  workspaceId: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 
    | 'INVOICE_IMPORTED'
    | 'INVOICE_CREATED'
    | 'INVOICE_EDITED'
    | 'INVOICE_VALIDATED'
    | 'VALIDATION_ERROR_DISMISSED'
    | 'TRANSFORMATION_EXECUTED'
    | 'SUBMISSION_ATTEMPTED'
    | 'SUBMISSION_ACCEPTED'
    | 'SUBMISSION_REJECTED'
    | 'SUBMISSION_FAILED'
    | 'STATUS_CHANGED'
    | 'MAPPING_TEMPLATE_SAVED'
    | 'CONFIG_UPDATED';
  invoiceId?: string;
  invoiceNumber?: string;
  previousStatus?: InvoiceStatus;
  newStatus?: InvoiceStatus;
  details: string;
  metadata?: Record<string, unknown>;
}
