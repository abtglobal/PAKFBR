/**
 * Pakistan FBR Digital Invoicing Compliance Platform
 * Validation Engine
 * 
 * Configurable multi-tiered validation engine enforcing:
 * 1. Structural rules
 * 2. Tax calculations & Schedule checks
 * 3. Business integrity & duplicate prevention
 * 4. FBR/PRAL technical specification compliance
 */

import {
  NormalizedInvoice,
  ValidationError,
  ValidationRuleDefinition,
  ValidationSummary,
} from '../types/fbr';

// Helper to test NTN format (7 digits + optional check digit or 8 digits)
export function isValidNTN(ntn: string | undefined): boolean {
  if (!ntn) return false;
  const cleaned = ntn.trim().replace(/-/g, '');
  return /^\d{7,8}$/.test(cleaned);
}

// Helper to test CNIC format (13 digits)
export function isValidCNIC(cnic: string | undefined): boolean {
  if (!cnic) return false;
  const cleaned = cnic.trim().replace(/-/g, '');
  return /^\d{13}$/.test(cleaned);
}

// Helper to test Pakistani STRN (Sales Tax Registration Number)
export function isValidSTRN(strn: string | undefined): boolean {
  if (!strn) return false;
  const cleaned = strn.trim().replace(/-/g, '');
  return /^\d{11,17}$/.test(cleaned);
}

// Helper to test HS Code format (e.g. 5208.1100, 8471.3000, 8 digits with or without dot)
export function isValidHSCode(hsCode: string | undefined): boolean {
  if (!hsCode) return false;
  const cleaned = hsCode.trim().replace(/\./g, '');
  return /^\d{4,8}$/.test(cleaned);
}

// Tolerance for floating point currency arithmetic (Pakistani Rupee rounding standard)
const CURRENCY_TOLERANCE = 0.50;

/**
 * Standard Rule Definitions
 */
export const DEFAULT_VALIDATION_RULES: ValidationRuleDefinition[] = [
  // ==========================================
  // 1. STRUCTURAL VALIDATION RULES
  // ==========================================
  {
    id: 'STRUCT_001',
    code: 'ERR_REQ_INVOICE_NO',
    name: 'Invoice Number Presence',
    category: 'STRUCTURAL',
    severity: 'ERROR',
    description: 'Invoice number is mandatory and cannot be empty.',
    fbrReference: 'FBR E-Invoicing Spec Sec 4.1',
    enabled: true,
    validate: (inv) => {
      const errors: ValidationError[] = [];
      if (!inv.invoiceNumber || inv.invoiceNumber.trim() === '') {
        errors.push({
          id: `${inv.id}-STRUCT_001`,
          errorCode: 'ERR_REQ_INVOICE_NO',
          severity: 'ERROR',
          category: 'STRUCTURAL',
          field: 'invoiceNumber',
          invoiceNumber: inv.invoiceNumber || 'UNASSIGNED',
          description: 'Invoice number is missing or blank.',
          suggestedCorrection: 'Provide a unique internal taxpayer invoice number.',
          validationRule: 'Structural: Mandatory Field',
        });
      }
      return errors;
    },
  },
  {
    id: 'STRUCT_002',
    code: 'ERR_REQ_INVOICE_DATE',
    name: 'Invoice Date Format & Validity',
    category: 'STRUCTURAL',
    severity: 'ERROR',
    description: 'Invoice date must be a valid ISO date (YYYY-MM-DD) and not future-dated.',
    fbrReference: 'FBR E-Invoicing Spec Sec 4.2',
    enabled: true,
    validate: (inv) => {
      const errors: ValidationError[] = [];
      if (!inv.invoiceDate || !/^\d{4}-\d{2}-\d{2}$/.test(inv.invoiceDate)) {
        errors.push({
          id: `${inv.id}-STRUCT_002_FMT`,
          errorCode: 'ERR_INVALID_DATE_FORMAT',
          severity: 'ERROR',
          category: 'STRUCTURAL',
          field: 'invoiceDate',
          invoiceNumber: inv.invoiceNumber,
          description: `Invoice date '${inv.invoiceDate}' is not in valid format (YYYY-MM-DD).`,
          suggestedCorrection: 'Format invoice date as YYYY-MM-DD.',
          validationRule: 'Structural: Date Format',
        });
      } else {
        const invTime = new Date(inv.invoiceDate).getTime();
        const now = new Date();
        const futureLimit = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
        if (invTime > futureLimit) {
          errors.push({
            id: `${inv.id}-STRUCT_002_FUT`,
            errorCode: 'ERR_FUTURE_INVOICE_DATE',
            severity: 'WARNING',
            category: 'STRUCTURAL',
            field: 'invoiceDate',
            invoiceNumber: inv.invoiceNumber,
            description: `Invoice date ${inv.invoiceDate} is in the future.`,
            suggestedCorrection: 'Confirm if invoice date is current or prior transaction.',
            validationRule: 'Structural: Date Range',
          });
        }
      }
      return errors;
    },
  },
  {
    id: 'STRUCT_003',
    code: 'ERR_SELLER_NTN',
    name: 'Seller NTN Validation',
    category: 'STRUCTURAL',
    severity: 'ERROR',
    description: 'Seller NTN must be a valid 7-8 digit Pakistani National Tax Number.',
    fbrReference: 'FBR Taxpayer Registration Spec',
    enabled: true,
    validate: (inv) => {
      const errors: ValidationError[] = [];
      if (!inv.seller?.ntn || !isValidNTN(inv.seller.ntn)) {
        errors.push({
          id: `${inv.id}-STRUCT_003`,
          errorCode: 'ERR_INVALID_SELLER_NTN',
          severity: 'ERROR',
          category: 'STRUCTURAL',
          field: 'seller.ntn',
          invoiceNumber: inv.invoiceNumber,
          description: `Seller NTN '${inv.seller?.ntn || ''}' is invalid or missing.`,
          suggestedCorrection: 'Enter a valid 7-digit NTN with check digit (e.g., 1234567-8).',
          validationRule: 'Structural: NTN Syntax',
        });
      }
      return errors;
    },
  },
  {
    id: 'STRUCT_004',
    code: 'ERR_BUYER_IDENTIFICATION',
    name: 'Buyer NTN or CNIC Verification',
    category: 'STRUCTURAL',
    severity: 'ERROR',
    description: 'Buyer must have valid NTN if registered or valid 13-digit CNIC if unregistered B2B/Walk-in over threshold.',
    fbrReference: 'Sales Tax Act 1990 Sec 23 & 3(1A)',
    enabled: true,
    validate: (inv) => {
      const errors: ValidationError[] = [];
      const buyer = inv.buyer;
      if (!buyer || !buyer.name || buyer.name.trim() === '') {
        errors.push({
          id: `${inv.id}-STRUCT_004_NAME`,
          errorCode: 'ERR_REQ_BUYER_NAME',
          severity: 'ERROR',
          category: 'STRUCTURAL',
          field: 'buyer.name',
          invoiceNumber: inv.invoiceNumber,
          description: 'Buyer Name is required.',
          suggestedCorrection: 'Provide buyer business or individual name.',
          validationRule: 'Structural: Buyer Info',
        });
      }

      if (buyer?.type === 'registered_business') {
        if (!buyer.ntn || !isValidNTN(buyer.ntn)) {
          errors.push({
            id: `${inv.id}-STRUCT_004_NTN`,
            errorCode: 'ERR_REGISTERED_BUYER_NTN_MISSING',
            severity: 'ERROR',
            category: 'STRUCTURAL',
            field: 'buyer.ntn',
            invoiceNumber: inv.invoiceNumber,
            description: `Registered buyer '${buyer.name}' is missing a valid 7-8 digit NTN.`,
            suggestedCorrection: 'Provide a valid NTN for registered buyer, or switch buyer type to Unregistered.',
            validationRule: 'FBR: Registered Taxpayer Identity',
          });
        }
      } else if (buyer?.type === 'unregistered_business') {
        // Unregistered B2B buyer should have CNIC if invoice value exceeds threshold
        if (inv.summary.grandTotal > 50000 && (!buyer.cnic || !isValidCNIC(buyer.cnic))) {
          errors.push({
            id: `${inv.id}-STRUCT_004_CNIC`,
            errorCode: 'WARN_HIGH_VALUE_CNIC_MISSING',
            severity: 'WARNING',
            category: 'STRUCTURAL',
            field: 'buyer.cnic',
            invoiceNumber: inv.invoiceNumber,
            description: `B2B sales over PKR 50,000 to unregistered buyers require CNIC/NTN under FBR section 23.`,
            suggestedCorrection: 'Obtain and record 13-digit CNIC of the unregistered purchaser.',
            validationRule: 'FBR: Section 23 Identity Threshold',
          });
        }
      }
      return errors;
    },
  },
  {
    id: 'STRUCT_005',
    code: 'ERR_EMPTY_ITEMS',
    name: 'Invoice Items Presence',
    category: 'STRUCTURAL',
    severity: 'ERROR',
    description: 'An invoice must contain at least one valid line item.',
    fbrReference: 'FBR E-Invoicing Item Schema',
    enabled: true,
    validate: (inv) => {
      const errors: ValidationError[] = [];
      if (!inv.items || inv.items.length === 0) {
        errors.push({
          id: `${inv.id}-STRUCT_005`,
          errorCode: 'ERR_NO_LINE_ITEMS',
          severity: 'ERROR',
          category: 'STRUCTURAL',
          field: 'items',
          invoiceNumber: inv.invoiceNumber,
          description: 'Invoice has zero line items.',
          suggestedCorrection: 'Add at least one goods/service line item.',
          validationRule: 'Structural: Line Item Multiplicity',
        });
      }
      return errors;
    },
  },

  // ==========================================
  // 2. TAX & ARITHMETIC VALIDATION RULES
  // ==========================================
  {
    id: 'TAX_001',
    code: 'ERR_LINE_TAXABLE_VALUE',
    name: 'Line Item Taxable Value Arithmetic',
    category: 'TAX_CALCULATION',
    severity: 'ERROR',
    description: 'Taxable value must equal (Quantity * Unit Price) - Discount.',
    fbrReference: 'Sales Tax Act 1990 Sec 2(46)',
    enabled: true,
    validate: (inv) => {
      const errors: ValidationError[] = [];
      inv.items.forEach((item, idx) => {
        const expectedTaxable = (item.quantity * item.unitPrice) - (item.discount || 0);
        const diff = Math.abs(expectedTaxable - item.taxableValue);
        if (diff > CURRENCY_TOLERANCE) {
          errors.push({
            id: `${inv.id}-TAX_001_${idx}`,
            errorCode: 'ERR_CALC_TAXABLE_VALUE',
            severity: 'ERROR',
            category: 'TAX_CALCULATION',
            field: `items[${idx}].taxableValue`,
            row: idx + 1,
            invoiceNumber: inv.invoiceNumber,
            description: `Item '${item.description}': Taxable value PKR ${item.taxableValue.toFixed(2)} does not match (Qty ${item.quantity} × Price ${item.unitPrice} - Disc ${item.discount}) = PKR ${expectedTaxable.toFixed(2)}.`,
            suggestedCorrection: `Update taxable value to PKR ${expectedTaxable.toFixed(2)}.`,
            validationRule: 'Tax Arithmetic: Taxable Value Check',
          });
        }
      });
      return errors;
    },
  },
  {
    id: 'TAX_002',
    code: 'ERR_LINE_SALES_TAX_AMOUNT',
    name: 'Sales Tax Rate & Amount Computation',
    category: 'TAX_CALCULATION',
    severity: 'ERROR',
    description: 'Sales tax amount must equal Taxable Value * (Sales Tax Rate / 100).',
    fbrReference: 'Sales Tax Act 1990 Sec 3',
    enabled: true,
    validate: (inv) => {
      const errors: ValidationError[] = [];
      inv.items.forEach((item, idx) => {
        if (!item.isExempt && !item.isZeroRated) {
          const expectedTax = (item.taxableValue * item.salesTaxRate) / 100;
          const diff = Math.abs(expectedTax - item.salesTaxAmount);
          if (diff > CURRENCY_TOLERANCE) {
            errors.push({
              id: `${inv.id}-TAX_002_${idx}`,
              errorCode: 'ERR_CALC_SALES_TAX',
              severity: 'ERROR',
              category: 'TAX_CALCULATION',
              field: `items[${idx}].salesTaxAmount`,
              row: idx + 1,
              invoiceNumber: inv.invoiceNumber,
              description: `Item '${item.description}': Sales tax PKR ${item.salesTaxAmount.toFixed(2)} does not match ${item.salesTaxRate}% of PKR ${item.taxableValue.toFixed(2)} (Expected PKR ${expectedTax.toFixed(2)}).`,
              suggestedCorrection: `Adjust sales tax amount to PKR ${expectedTax.toFixed(2)}.`,
              validationRule: 'Tax Arithmetic: Sales Tax Rate',
            });
          }
        }
      });
      return errors;
    },
  },
  {
    id: 'TAX_003',
    code: 'ERR_FURTHER_TAX_RULE',
    name: 'Further Tax Section 3(1A) Compliance',
    category: 'TAX_CALCULATION',
    severity: 'WARNING',
    description: 'Supplies to unregistered persons must be charged 3% Further Tax unless exempt or end consumer.',
    fbrReference: 'Sales Tax Act 1990 Sec 3(1A) & SRO Notifications',
    enabled: true,
    validate: (inv) => {
      const errors: ValidationError[] = [];
      const isUnregistered = inv.buyer?.type === 'unregistered_business';
      if (isUnregistered) {
        inv.items.forEach((item, idx) => {
          if (!item.isExempt && !item.isZeroRated && item.salesTaxRate > 0) {
            if (item.furtherTaxAmount <= 0) {
              errors.push({
                id: `${inv.id}-TAX_003_${idx}`,
                errorCode: 'WARN_FURTHER_TAX_APPLICABLE',
                severity: 'WARNING',
                category: 'TAX_CALCULATION',
                field: `items[${idx}].furtherTaxAmount`,
                row: idx + 1,
                invoiceNumber: inv.invoiceNumber,
                description: `Item '${item.description}' sold to unregistered business without 3% Further Tax.`,
                suggestedCorrection: `Check if 3% Further Tax applies (PKR ${((item.taxableValue * 3) / 100).toFixed(2)}) or if exempt under SRO schedule.`,
                validationRule: 'FBR Tax Law: Section 3(1A) Further Tax',
              });
            }
          }
        });
      }
      return errors;
    },
  },
  {
    id: 'TAX_004',
    code: 'ERR_HEADER_SUMMARY_MISMATCH',
    name: 'Invoice Header & Line Items Totals Reconciliation',
    category: 'TAX_CALCULATION',
    severity: 'ERROR',
    description: 'Header total values must match the exact sum of all line item components.',
    fbrReference: 'FBR Digital Invoicing Schema Reconciliation',
    enabled: true,
    validate: (inv) => {
      const errors: ValidationError[] = [];
      const sumTaxable = inv.items.reduce((acc, it) => acc + it.taxableValue, 0);
      const sumSalesTax = inv.items.reduce((acc, it) => acc + it.salesTaxAmount, 0);
      const sumFurtherTax = inv.items.reduce((acc, it) => acc + it.furtherTaxAmount, 0);
      const sumGrandTotal = inv.items.reduce((acc, it) => acc + it.totalAmount, 0);

      if (Math.abs(sumTaxable - inv.summary.totalTaxableValue) > CURRENCY_TOLERANCE) {
        errors.push({
          id: `${inv.id}-TAX_004_TAXABLE`,
          errorCode: 'ERR_HEADER_TAXABLE_MISMATCH',
          severity: 'ERROR',
          category: 'TAX_CALCULATION',
          field: 'summary.totalTaxableValue',
          invoiceNumber: inv.invoiceNumber,
          description: `Header taxable total PKR ${inv.summary.totalTaxableValue.toFixed(2)} differs from line items sum PKR ${sumTaxable.toFixed(2)}.`,
          suggestedCorrection: `Recompute header taxable total to PKR ${sumTaxable.toFixed(2)}.`,
          validationRule: 'Reconciliation: Header vs Lines Taxable',
        });
      }

      if (Math.abs(sumSalesTax - inv.summary.totalSalesTax) > CURRENCY_TOLERANCE) {
        errors.push({
          id: `${inv.id}-TAX_004_STAX`,
          errorCode: 'ERR_HEADER_STAX_MISMATCH',
          severity: 'ERROR',
          category: 'TAX_CALCULATION',
          field: 'summary.totalSalesTax',
          invoiceNumber: inv.invoiceNumber,
          description: `Header sales tax PKR ${inv.summary.totalSalesTax.toFixed(2)} differs from line items sum PKR ${sumSalesTax.toFixed(2)}.`,
          suggestedCorrection: `Recompute header sales tax to PKR ${sumSalesTax.toFixed(2)}.`,
          validationRule: 'Reconciliation: Header vs Lines Sales Tax',
        });
      }

      if (Math.abs(sumGrandTotal - inv.summary.grandTotal) > CURRENCY_TOLERANCE) {
        errors.push({
          id: `${inv.id}-TAX_004_TOTAL`,
          errorCode: 'ERR_HEADER_GRAND_TOTAL_MISMATCH',
          severity: 'ERROR',
          category: 'TAX_CALCULATION',
          field: 'summary.grandTotal',
          invoiceNumber: inv.invoiceNumber,
          description: `Header grand total PKR ${inv.summary.grandTotal.toFixed(2)} differs from line items sum PKR ${sumGrandTotal.toFixed(2)}.`,
          suggestedCorrection: `Recompute header grand total to PKR ${sumGrandTotal.toFixed(2)}.`,
          validationRule: 'Reconciliation: Grand Total Consistency',
        });
      }

      return errors;
    },
  },

  // ==========================================
  // 3. BUSINESS LOGIC & DUPLICATE CHECKS
  // ==========================================
  {
    id: 'BIZ_001',
    code: 'ERR_DUPLICATE_INVOICE_NO',
    name: 'Duplicate Invoice Number Detection',
    category: 'BUSINESS_LOGIC',
    severity: 'ERROR',
    description: 'Invoice numbers must be unique across the workspace.',
    fbrReference: 'General Accounting & FBR Anti-Duplication Rule',
    enabled: true,
    validate: (inv, allInvoices) => {
      const errors: ValidationError[] = [];
      if (allInvoices && inv.invoiceNumber) {
        const duplicates = allInvoices.filter(
          (other) => other.id !== inv.id && other.invoiceNumber.trim().toLowerCase() === inv.invoiceNumber.trim().toLowerCase()
        );
        if (duplicates.length > 0) {
          errors.push({
            id: `${inv.id}-BIZ_001`,
            errorCode: 'ERR_DUPLICATE_INVOICE_NUMBER',
            severity: 'ERROR',
            category: 'BUSINESS_LOGIC',
            field: 'invoiceNumber',
            invoiceNumber: inv.invoiceNumber,
            description: `Invoice number '${inv.invoiceNumber}' is duplicated (${duplicates.length} other record(s) found).`,
            suggestedCorrection: 'Ensure unique sequential invoice numbering.',
            validationRule: 'Business Logic: Unique Invoice Identifier',
          });
        }
      }
      return errors;
    },
  },
  {
    id: 'BIZ_002',
    code: 'ERR_NEGATIVE_QUANTITY_PRICE',
    name: 'Non-Negative Quantity and Unit Price',
    category: 'BUSINESS_LOGIC',
    severity: 'ERROR',
    description: 'Standard sales invoices cannot have negative quantities or unit prices.',
    fbrReference: 'FBR Positive Line Values Invariant',
    enabled: true,
    validate: (inv) => {
      const errors: ValidationError[] = [];
      if (inv.invoiceType === 'sales') {
        inv.items.forEach((item, idx) => {
          if (item.quantity <= 0) {
            errors.push({
              id: `${inv.id}-BIZ_002_QTY_${idx}`,
              errorCode: 'ERR_ZERO_OR_NEGATIVE_QTY',
              severity: 'ERROR',
              category: 'BUSINESS_LOGIC',
              field: `items[${idx}].quantity`,
              row: idx + 1,
              invoiceNumber: inv.invoiceNumber,
              description: `Item '${item.description}' has zero or negative quantity (${item.quantity}).`,
              suggestedCorrection: 'Quantity must be greater than zero for standard sales invoice.',
              validationRule: 'Business Logic: Positive Quantity',
            });
          }
          if (item.unitPrice <= 0) {
            errors.push({
              id: `${inv.id}-BIZ_002_PRC_${idx}`,
              errorCode: 'ERR_ZERO_OR_NEGATIVE_PRICE',
              severity: 'ERROR',
              category: 'BUSINESS_LOGIC',
              field: `items[${idx}].unitPrice`,
              row: idx + 1,
              invoiceNumber: inv.invoiceNumber,
              description: `Item '${item.description}' has zero or negative unit price (PKR ${item.unitPrice}).`,
              suggestedCorrection: 'Unit price must be positive. For free samples/promotions use separate discount or 0% tax code.',
              validationRule: 'Business Logic: Positive Price',
            });
          }
        });
      }
      return errors;
    },
  },

  // ==========================================
  // 4. FBR SPECIFICATION RULES
  // ==========================================
  {
    id: 'FBR_001',
    code: 'ERR_HS_CODE_FORMAT',
    name: 'HS Code (Harmonized System) Compliance',
    category: 'FBR_SPECIFICATION',
    severity: 'WARNING',
    description: 'Every line item should specify a standard 4 to 8 digit Pakistan Customs HS Code.',
    fbrReference: 'FBR E-Invoicing HS Code Catalog Standard',
    enabled: true,
    validate: (inv) => {
      const errors: ValidationError[] = [];
      inv.items.forEach((item, idx) => {
        if (!item.hsCode || !isValidHSCode(item.hsCode)) {
          errors.push({
            id: `${inv.id}-FBR_001_${idx}`,
            errorCode: 'WARN_INVALID_HS_CODE',
            severity: 'WARNING',
            category: 'FBR_SPECIFICATION',
            field: `items[${idx}].hsCode`,
            row: idx + 1,
            invoiceNumber: inv.invoiceNumber,
            description: `Item '${item.description}' has missing or non-standard HS Code '${item.hsCode || ''}'.`,
            suggestedCorrection: 'Provide standard 8-digit HS Code (e.g., 5208.1100 for Cotton Fabrics).',
            validationRule: 'FBR Spec: Pakistan Customs Tariff Classification',
          });
        }
      });
      return errors;
    },
  },
  {
    id: 'FBR_002',
    code: 'ERR_UOM_MANDATORY',
    name: 'Unit of Measure (UOM) Standardization',
    category: 'FBR_SPECIFICATION',
    severity: 'INFO',
    description: 'Line item UOM should align with standardized trade units (PCS, KGS, MTR, LTR, PKT, NOS).',
    fbrReference: 'FBR Standard UOM Dictionary',
    enabled: true,
    validate: (inv) => {
      const errors: ValidationError[] = [];
      const validUOMs = ['PCS', 'KGS', 'MTR', 'LTR', 'PKT', 'NOS', 'BAG', 'BOX', 'DOZ', 'SET', 'TON', 'SQM', 'UNT', 'KG', 'M', 'L'];
      inv.items.forEach((item, idx) => {
        if (!item.uom || !validUOMs.includes(item.uom.toUpperCase().trim())) {
          errors.push({
            id: `${inv.id}-FBR_002_${idx}`,
            errorCode: 'INFO_NON_STANDARD_UOM',
            severity: 'INFO',
            category: 'FBR_SPECIFICATION',
            field: `items[${idx}].uom`,
            row: idx + 1,
            invoiceNumber: inv.invoiceNumber,
            description: `Item '${item.description}' uses non-standard UOM '${item.uom || ''}'.`,
            suggestedCorrection: `Use recognized standard UOM (e.g., ${validUOMs.slice(0, 6).join(', ')}).`,
            validationRule: 'FBR Spec: Standard Unit of Measurement',
          });
        }
      });
      return errors;
    },
  },
  {
    id: 'FBR_003',
    code: 'ERR_CREDIT_DEBIT_NOTE_REF',
    name: 'Debit/Credit Note Reference Requirement',
    category: 'FBR_SPECIFICATION',
    severity: 'ERROR',
    description: 'Debit Notes and Credit Notes must cite the original invoice reference number.',
    fbrReference: 'Sales Tax Rules 2006 Chapter III',
    enabled: true,
    validate: (inv) => {
      const errors: ValidationError[] = [];
      if ((inv.invoiceType === 'debit_note' || inv.invoiceType === 'credit_note') && (!inv.referenceNumber || inv.referenceNumber.trim() === '')) {
        errors.push({
          id: `${inv.id}-FBR_003`,
          errorCode: 'ERR_ORIGINAL_INVOICE_REF_REQUIRED',
          severity: 'ERROR',
          category: 'FBR_SPECIFICATION',
          field: 'referenceNumber',
          invoiceNumber: inv.invoiceNumber,
          description: `Adjustment document (${inv.invoiceType}) requires original invoice reference number.`,
          suggestedCorrection: 'Specify the original FBR or taxpayer invoice number being adjusted.',
          validationRule: 'FBR Spec: Section 9 Adjustment Document Rule',
        });
      }
      return errors;
    },
  }
];

export class ValidationEngine {
  private rules: ValidationRuleDefinition[];

  constructor(customRules?: ValidationRuleDefinition[]) {
    this.rules = customRules || [...DEFAULT_VALIDATION_RULES];
  }

  public getRules(): ValidationRuleDefinition[] {
    return this.rules;
  }

  public toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  public updateRuleSeverity(ruleId: string, severity: 'ERROR' | 'WARNING' | 'INFO'): void {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) {
      rule.severity = severity;
    }
  }

  public validateInvoice(invoice: NormalizedInvoice, allInvoices?: NormalizedInvoice[]): ValidationError[] {
    const activeRules = this.rules.filter((r) => r.enabled);
    const errors: ValidationError[] = [];

    for (const rule of activeRules) {
      try {
        const result = rule.validate(invoice, allInvoices);
        errors.push(...result);
      } catch (err) {
        console.error(`Error executing validation rule ${rule.code}:`, err);
      }
    }

    return errors;
  }

  public validateBatch(invoices: NormalizedInvoice[]): {
    validatedInvoices: NormalizedInvoice[];
    summary: ValidationSummary;
  } {
    let validCount = 0;
    let invalidCount = 0;
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    const validatedInvoices = invoices.map((invoice) => {
      const errors = this.validateInvoice(invoice, invoices);
      const hasBlockingErrors = errors.some((e) => e.severity === 'ERROR');

      errors.forEach((e) => {
        if (e.severity === 'ERROR') errorCount++;
        else if (e.severity === 'WARNING') warningCount++;
        else if (e.severity === 'INFO') infoCount++;
      });

      const validationStatus: 'valid' | 'invalid' = hasBlockingErrors ? 'invalid' : 'valid';
      if (validationStatus === 'valid') {
        validCount++;
      } else {
        invalidCount++;
      }

      const updatedStatus = hasBlockingErrors 
        ? (invoice.status === 'READY' || invoice.status === 'VALIDATED' ? 'DRAFT' : invoice.status)
        : (invoice.status === 'DRAFT' ? 'VALIDATED' : invoice.status);

      return {
        ...invoice,
        validationStatus,
        validationErrors: errors,
        status: updatedStatus,
        updatedAt: new Date().toISOString(),
      };
    });

    return {
      validatedInvoices,
      summary: {
        totalChecked: invoices.length,
        validCount,
        invalidCount,
        errorCount,
        warningCount,
        infoCount,
      },
    };
  }
}

export const validationEngine = new ValidationEngine();
