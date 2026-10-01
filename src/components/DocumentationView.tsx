import React, { useState } from 'react';
import {
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  Database,
  Layers,
  FileCode,
  Lock,
  Workflow,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Receipt,
  Server
} from 'lucide-react';

export function DocumentationView() {
  const [activeSection, setActiveSection] = useState<'OVERVIEW' | 'FBR_SPEC' | 'TRANSFORMATION' | 'SECURITY'>('OVERVIEW');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-1">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>STATUTORY COMPLIANCE SPECIFICATION</span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Compliance Architecture & FBR Technical Standard</h1>
          <p className="text-xs text-stone-600 font-medium mt-1">
            Comprehensive system architecture, Pakistan Sales Tax Act 1990 rules, and PRAL API specifications.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-white border border-stone-200 p-1.5 rounded-2xl w-fit shadow-xs flex-wrap">
        <button
          onClick={() => setActiveSection('OVERVIEW')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSection === 'OVERVIEW' ? 'bg-amber-500 text-white shadow-xs' : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
          }`}
        >
          Architectural Blueprint
        </button>
        <button
          onClick={() => setActiveSection('FBR_SPEC')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSection === 'FBR_SPEC' ? 'bg-amber-500 text-white shadow-xs' : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
          }`}
        >
          FBR PRAL Schema Specification
        </button>
        <button
          onClick={() => setActiveSection('TRANSFORMATION')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSection === 'TRANSFORMATION' ? 'bg-amber-500 text-white shadow-xs' : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
          }`}
        >
          Ingestion & Tax Math Pipeline
        </button>
        <button
          onClick={() => setActiveSection('SECURITY')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSection === 'SECURITY' ? 'bg-amber-500 text-white shadow-xs' : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
          }`}
        >
          Local Data Sovereignty & Audit
        </button>
      </div>

      {/* SECTION 1: OVERVIEW */}
      {activeSection === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-stone-900">Your Architecture: 100% Pakistan Statutory Standard</h2>
            <p className="text-xs text-stone-700 leading-relaxed font-medium">
              This architecture is grounded exclusively in the statutory rules of the <strong>Pakistan Sales Tax Act 1990</strong>, 
              <strong>Federal Board of Revenue (FBR) Digital Invoicing Rules 2024</strong>, and the <strong>PRAL API Gateway</strong> technical specifications.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-1">
                <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>1. Statutory Accuracy</span>
                </div>
                <p className="text-[11px] text-stone-600">
                  Strict 18% standard sales tax calculations, 3% further tax under Sec 3(1A) on unregistered buyers, and 5th/6th/8th schedule handling.
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-1">
                <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                  <Workflow className="w-4 h-4 text-amber-600" />
                  <span>2. Zero Silent Alteration</span>
                </div>
                <p className="text-[11px] text-stone-600">
                  Invoices are never silently adjusted. Any arithmetic discrepancy or missing NTN is flagged with clear blocking error messages.
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-1">
                <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>3. Local Data Sovereignty</span>
                </div>
                <p className="text-[11px] text-stone-600">
                  All company data, invoices, and buyer registries reside exclusively in your local database with 0 third-party telemetry.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900">Core Engine Components</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-stone-700">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1">
                <div className="font-bold text-stone-900">Excel / ERP Ingestion Engine</div>
                <p className="text-stone-600">Parses multi-line Excel sheets, maps custom ERP headers, groups items by invoice number, and checks calculations.</p>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1">
                <div className="font-bold text-stone-900">Statutory PDF Generator</div>
                <p className="text-stone-600">Creates vector PDF tax invoices with embedded FBR verification QR codes, NTN/STRN headers, and amounts in words.</p>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1">
                <div className="font-bold text-stone-900">PRAL Transmission Adapter</div>
                <p className="text-stone-600">Transforms normalized records into official FBR JSON payloads, submits via secure Bearer tokens, and records IRNs.</p>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1">
                <div className="font-bold text-stone-900">Customs HS Tariff Catalog</div>
                <p className="text-stone-600">Built-in reference of 8-digit Pakistan Customs Tariff codes, standard units of measurement, and statutory schedules.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: FBR SPEC */}
      {activeSection === 'FBR_SPEC' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-stone-900">PRAL Digital Invoicing JSON Payload Standard</h2>
          <p className="text-xs text-stone-600 font-medium">
            Format required by Federal Board of Revenue (FBR) Digital Invoicing Gateway for Tier-1 retailers and registered businesses:
          </p>

          <div className="bg-stone-50 border border-stone-300 rounded-xl p-4 font-mono text-xs text-stone-900 overflow-x-auto">
            <pre>{`{
  "InvoiceNumber": "INV-2026-001",
  "POSID": 1001,
  "USIN": "INV-2026-001",
  "DateTime": "2026-10-01 10:00:00",
  "BuyerNTN": "1234567-8",
  "BuyerCNIC": "",
  "BuyerName": "Packages Limited",
  "BuyerPhoneNumber": "",
  "TotalBillAmount": 35400.00,
  "TotalQuantity": 10.00,
  "TotalSaleValue": 30000.00,
  "TotalTaxCharged": 5400.00,
  "FurtherTax": 0.00,
  "PaymentMode": 1,
  "InvoiceType": 1,
  "Items": [
    {
      "ItemCode": "SKU-001",
      "ItemName": "Cotton Fabrics Woven",
      "PCTCode": "5208.1100",
      "Quantity": 10.00,
      "TotalAmount": 35400.00,
      "SaleValue": 30000.00,
      "TaxRate": 18.00,
      "TaxCharged": 5400.00,
      "FurtherTax": 0.00,
      "InvoiceType": 1
    }
  ]
}`}</pre>
          </div>
        </div>
      )}

      {/* SECTION 3: TRANSFORMATION */}
      {activeSection === 'TRANSFORMATION' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-stone-900">Ingestion & Tax Math Pipeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-stone-700">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1">
              <div className="font-bold text-stone-900">Standard Sales Tax (18%)</div>
              <p className="text-stone-600">Computed on taxable value after deducting admissible trade discounts under Sales Tax General Order rules.</p>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1">
              <div className="font-bold text-stone-900">Further Tax (3% under Sec 3(1A))</div>
              <p className="text-stone-600">Automatically added on supplies made to persons who have not obtained sales tax registration.</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: SECURITY */}
      {activeSection === 'SECURITY' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-stone-900">Local Data Sovereignty & Audit</h2>
          <p className="text-xs text-stone-600 font-medium">
            All compliance operations are stored in your private local browser or desktop database.
          </p>
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs text-stone-700 space-y-2">
            <div><strong>Zero Cloud Leakage:</strong> Your customer names, pricing, and turnover never leave your computer unless you explicitly submit to the FBR API.</div>
            <div><strong>Immutable Audit Trail:</strong> Every single invoice change is timestamped and recorded in the audit log for regulatory compliance.</div>
          </div>
        </div>
      )}
    </div>
  );
}
