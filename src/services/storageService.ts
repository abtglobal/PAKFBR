/**
 * Pakistan FBR Digital Invoicing Compliance Platform
 * Storage & Workspace State Management Service
 * 
 * Clean, production-ready storage layer with zero test data.
 */

import {
  Workspace,
  NormalizedInvoice,
  ColumnMappingConfig,
  AuditEntry,
  TaxRateConfig,
  HSCodeDefinition,
} from '../types/fbr';

// Storage keys - Version 3 (completely clean slate, zero test records)
const STORAGE_KEYS = {
  WORKSPACES: 'paktax_workspaces_v3',
  ACTIVE_WORKSPACE_ID: 'paktax_active_workspace_id_v3',
  INVOICES: 'paktax_invoices_v3',
  MAPPINGS: 'paktax_mappings_v3',
  AUDIT_LOGS: 'paktax_audit_logs_v3',
  TAX_RATES: 'paktax_tax_rates_v3',
  HS_CODES: 'paktax_hs_codes_v3',
  CUSTOM_RULES: 'paktax_custom_rules_v3',
};

// Purge any and all legacy test keys from previous versions
const LEGACY_KEYS_TO_PURGE = [
  'paktax_workspaces_v1',
  'paktax_workspaces_v2',
  'paktax_active_workspace_id_v1',
  'paktax_active_workspace_id_v2',
  'paktax_invoices_v1',
  'paktax_invoices_v2',
  'paktax_mappings_v1',
  'paktax_mappings_v2',
  'paktax_audit_logs_v1',
  'paktax_audit_logs_v2',
  'paktax_tax_rates_v1',
  'paktax_tax_rates_v2',
  'paktax_hs_codes_v1',
  'paktax_hs_codes_v2',
  'paktax_custom_rules_v1',
  'paktax_custom_rules_v2',
  'paktax_users_v1',
  'paktax_users_v2',
  'paktax_users_v2_ws_taxpayer_primary',
  'paktax_customers_v1',
  'paktax_customers_v2',
  'paktax_customers_v2_ws_taxpayer_primary',
  'paktax_products_v1',
  'paktax_products_v2',
  'paktax_products_v2_ws_taxpayer_primary',
];

// Clean Taxpayer Workspace template with 0 test data or fake names
export const DEFAULT_WORKSPACE: Workspace = {
  id: 'ws_taxpayer_primary',
  profile: {
    id: 'prof_primary',
    name: '',
    businessName: '',
    ntn: '',
    strn: '',
    principalActivity: '',
    sector: 'manufacturing',
    address: '',
    city: '',
    province: '',
    contactEmail: '',
    contactPhone: '',
    posId: '',
  },
  taxConfig: {
    standardSalesTaxRate: 18,
    furtherTaxRate: 3,
    enableFurtherTaxForUnregistered: true,
    defaultCurrency: 'PKR',
    provincialTaxAuthority: 'FBR_FEDERAL',
  },
  fbrConfig: {
    workspaceId: 'ws_taxpayer_primary',
    environment: 'SANDBOX',
    sandboxEndpointUrl: 'https://sandbox.fbr.gov.pk/digital-invoicing/v1/invoices',
    productionEndpointUrl: 'https://e.fbr.gov.pk/digital-invoicing/v1/invoices',
    posId: '',
    bearerToken: '',
    apiKey: '',
    timeoutMs: 8000,
    retryAttempts: 3,
    autoValidateBeforeSubmit: true,
    generateQRCode: true,
    isConfirmedByTaxpayer: false,
  },
  userRole: 'ADMIN',
};

// Standard Statutory Tax Rates (Sales Tax Act 1990)
export const STATUTORY_TAX_RATES: TaxRateConfig[] = [
  {
    id: 'TR_01',
    name: 'Standard Sales Tax (Federal)',
    code: 'ST_18',
    rate: 18.0,
    type: 'standard',
    schedule: 'Sales Tax Act 1990 Sec 3(1)',
    description: 'Standard ad-valorem sales tax rate applicable on standard taxable supplies.',
    isDefault: true,
  },
  {
    id: 'TR_02',
    name: 'Further Tax (Unregistered Persons)',
    code: 'FT_03',
    rate: 3.0,
    type: 'further_tax',
    schedule: 'Sales Tax Act 1990 Sec 3(1A)',
    description: 'Mandatory further tax levied on taxable supplies made to unregistered persons.',
  },
  {
    id: 'TR_03',
    name: 'Zero-Rated (Exports & 5th Schedule)',
    code: 'ZR_00',
    rate: 0.0,
    type: 'zero_rated',
    schedule: 'Fifth Schedule / Sec 4',
    description: 'Zero percent rate for direct export supplies, EPZ supplies, and approved 5th Schedule goods.',
  },
  {
    id: 'TR_04',
    name: 'Exempt Goods (6th Schedule Table-1)',
    code: 'EX_00',
    rate: 0.0,
    type: 'exempt',
    schedule: 'Sixth Schedule (Table-1)',
    description: 'Statutory exemption from sales tax for designated essential goods.',
  },
  {
    id: 'TR_05',
    name: 'Reduced Rate (8th Schedule)',
    code: 'RR_10',
    rate: 10.0,
    type: 'reduced',
    schedule: 'Eighth Schedule (Table-1)',
    description: 'Concessionary rate applicable to specified agricultural machinery and localized supplies.',
  },
  {
    id: 'TR_06',
    name: 'Provincial Services Tax (SRB/PRA)',
    code: 'SRB_15',
    rate: 15.0,
    type: 'provincial',
    schedule: 'Sindh Sales Tax on Services Act 2011',
    description: 'Sales tax on services rendered in Sindh or Punjab territory.',
  },
];

// Empty product & HS code catalog for virgin state (0 test items)
export const STANDARD_HS_CODES: HSCodeDefinition[] = [];

// Empty column mapping profiles for virgin state (0 test profiles)
export const STANDARD_MAPPING_PROFILES: ColumnMappingConfig[] = [];

export class StorageService {
  private workspaces: Workspace[] = [];
  private activeWorkspaceId: string = DEFAULT_WORKSPACE.id;
  private invoices: NormalizedInvoice[] = [];
  private mappings: ColumnMappingConfig[] = [];
  private taxRates: TaxRateConfig[] = [];
  private hsCodes: HSCodeDefinition[] = [];

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Enforce 100% virgin clean slate on startup (wipes any leftover test/demo browser cache)
    const VIRGIN_SLATE_KEY = 'paktax_virgin_state_v5';
    if (!localStorage.getItem(VIRGIN_SLATE_KEY)) {
      try {
        localStorage.clear();
        localStorage.setItem(VIRGIN_SLATE_KEY, 'true');
      } catch (_) {}
    }

    // Load or initialize workspaces (zero fake companies)
    const savedWs = localStorage.getItem(STORAGE_KEYS.WORKSPACES);
    this.workspaces = savedWs ? JSON.parse(savedWs) : [DEFAULT_WORKSPACE];

    const savedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKSPACE_ID);
    this.activeWorkspaceId = savedActiveId || (this.workspaces[0]?.id || DEFAULT_WORKSPACE.id);

    // Invoices - Pristine empty array (NO test invoices)
    const savedInvoices = localStorage.getItem(STORAGE_KEYS.INVOICES);
    this.invoices = savedInvoices ? JSON.parse(savedInvoices) : [];

    // Mappings - Virgin empty array
    const savedMappings = localStorage.getItem(STORAGE_KEYS.MAPPINGS);
    this.mappings = savedMappings ? JSON.parse(savedMappings) : [];

    // Tax Rates - Statutory schedules under Sales Tax Act
    const savedRates = localStorage.getItem(STORAGE_KEYS.TAX_RATES);
    this.taxRates = savedRates ? JSON.parse(savedRates) : STATUTORY_TAX_RATES;

    // HS Codes - Virgin empty array
    const savedHS = localStorage.getItem(STORAGE_KEYS.HS_CODES);
    this.hsCodes = savedHS ? JSON.parse(savedHS) : [];

    this.persistAll();
  }

  private persistAll(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.WORKSPACES, JSON.stringify(this.workspaces));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKSPACE_ID, this.activeWorkspaceId);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(this.invoices));
    localStorage.setItem(STORAGE_KEYS.MAPPINGS, JSON.stringify(this.mappings));
    localStorage.setItem(STORAGE_KEYS.TAX_RATES, JSON.stringify(this.taxRates));
    localStorage.setItem(STORAGE_KEYS.HS_CODES, JSON.stringify(this.hsCodes));
  }

  // Workspaces
  public getWorkspaces(): Workspace[] {
    return this.workspaces;
  }

  public getActiveWorkspace(): Workspace {
    const ws = this.workspaces.find((w) => w.id === this.activeWorkspaceId);
    return ws || this.workspaces[0] || DEFAULT_WORKSPACE;
  }

  public setActiveWorkspace(workspaceId: string): void {
    this.activeWorkspaceId = workspaceId;
    this.persistAll();
  }

  public updateWorkspace(workspace: Workspace): void {
    const idx = this.workspaces.findIndex((w) => w.id === workspace.id);
    if (idx >= 0) {
      this.workspaces[idx] = workspace;
      this.persistAll();
    }
  }

  public addWorkspace(workspace: Workspace): void {
    this.workspaces.push(workspace);
    this.persistAll();
  }

  // Invoices (Workspace-isolated)
  public getInvoices(workspaceId?: string): NormalizedInvoice[] {
    const wsId = workspaceId || this.activeWorkspaceId;
    return this.invoices.filter((inv) => inv.workspaceId === wsId);
  }

  public getInvoiceById(id: string): NormalizedInvoice | undefined {
    return this.invoices.find((inv) => inv.id === id);
  }

  public saveInvoice(invoice: NormalizedInvoice): void {
    const idx = this.invoices.findIndex((inv) => inv.id === invoice.id);
    if (idx >= 0) {
      this.invoices[idx] = invoice;
    } else {
      this.invoices.unshift(invoice);
    }
    this.persistAll();
  }

  public saveInvoicesBatch(newInvoices: NormalizedInvoice[]): void {
    newInvoices.forEach((inv) => {
      const idx = this.invoices.findIndex((existing) => existing.id === inv.id);
      if (idx >= 0) {
        this.invoices[idx] = inv;
      } else {
        this.invoices.unshift(inv);
      }
    });
    this.persistAll();
  }

  public deleteInvoice(id: string): void {
    this.invoices = this.invoices.filter((inv) => inv.id !== id);
    this.persistAll();
  }

  public clearAllInvoices(workspaceId?: string): void {
    const wsId = workspaceId || this.activeWorkspaceId;
    this.invoices = this.invoices.filter((inv) => inv.workspaceId !== wsId);
    this.persistAll();
  }

  // Mapping Templates
  public getMappingTemplates(workspaceId?: string): ColumnMappingConfig[] {
    const wsId = workspaceId || this.activeWorkspaceId;
    return this.mappings.filter((m) => m.workspaceId === wsId || m.workspaceId === 'global');
  }

  public saveMappingTemplate(config: ColumnMappingConfig): void {
    const idx = this.mappings.findIndex((m) => m.id === config.id);
    if (idx >= 0) {
      this.mappings[idx] = config;
    } else {
      this.mappings.push(config);
    }
    this.persistAll();
  }

  public deleteMappingTemplate(id: string): void {
    this.mappings = this.mappings.filter((m) => m.id !== id);
    this.persistAll();
  }

  // Tax Rates & HS Codes
  public getTaxRates(): TaxRateConfig[] {
    return this.taxRates;
  }

  public saveTaxRate(rate: TaxRateConfig): void {
    const idx = this.taxRates.findIndex((r) => r.id === rate.id);
    if (idx >= 0) this.taxRates[idx] = rate;
    else this.taxRates.push(rate);
    this.persistAll();
  }

  public getHSCodes(): HSCodeDefinition[] {
    return this.hsCodes;
  }

  public saveHSCode(hs: HSCodeDefinition): void {
    const idx = this.hsCodes.findIndex((h) => h.hsCode === hs.hsCode);
    if (idx >= 0) this.hsCodes[idx] = hs;
    else this.hsCodes.push(hs);
    this.persistAll();
  }

  // Audit Log
  public getAuditLogs(workspaceId?: string): AuditEntry[] {
    const wsId = workspaceId || this.activeWorkspaceId;
    const allEntries: AuditEntry[] = [];
    
    this.getInvoices(wsId).forEach((inv) => {
      if (inv.auditTrail) {
        allEntries.push(...inv.auditTrail);
      }
    });

    return allEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public logAudit(entry: AuditEntry): void {
    const invoice = entry.invoiceId ? this.getInvoiceById(entry.invoiceId) : undefined;
    if (invoice) {
      invoice.auditTrail = [entry, ...(invoice.auditTrail || [])];
      this.saveInvoice(invoice);
    }
  }

  // Complete clean slate wipe
  public wipeAllData(): void {
    this.workspaces = [DEFAULT_WORKSPACE];
    this.activeWorkspaceId = DEFAULT_WORKSPACE.id;
    this.invoices = [];
    this.mappings = STANDARD_MAPPING_PROFILES;
    this.taxRates = STATUTORY_TAX_RATES;
    this.hsCodes = STANDARD_HS_CODES;
    this.persistAll();
  }
}

export const storageService = new StorageService();
