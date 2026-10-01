import React, { useState } from 'react';
import {
  CheckSquare,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Check
} from 'lucide-react';
import { NormalizedInvoice, ValidationError } from '../types/fbr';
import { validationEngine } from '../services/validationEngine';

export function ValidationEngineView({
  invoices,
  onUpdateInvoices,
}: {
  invoices: NormalizedInvoice[];
  onUpdateInvoices: (invoices: NormalizedInvoice[]) => void;
}) {
  const [isValidating, setIsValidating] = useState(false);

  const handleRunFullValidation = () => {
    setIsValidating(true);
    try {
      const { validatedInvoices, summary } = validationEngine.validateBatch(invoices);
      onUpdateInvoices(validatedInvoices);
      alert(`Validation complete: ${summary.validCount} valid invoices, ${summary.invalidCount} invalid with ${summary.errorCount} blocking errors.`);
    } catch (err: any) {
      alert(`Validation error: ${err.message || err}`);
    } finally {
      setIsValidating(false);
    }
  };

  const totalErrors = invoices.reduce(
    (sum, inv) => sum + inv.validationErrors.filter((e) => e.severity === 'ERROR').length,
    0
  );
  const totalWarnings = invoices.reduce(
    (sum, inv) => sum + inv.validationErrors.filter((e) => e.severity === 'WARNING').length,
    0
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-1">
            <CheckSquare className="w-4 h-4 text-amber-600" />
            <span>STATUTORY COMPLIANCE & ARITHMETIC RULES</span>
          </div>
          <h2 className="text-base font-bold text-stone-900">Validation Rule Engine</h2>
          <p className="text-xs text-stone-600 font-medium mt-0.5">
            Real-time validation against Sales Tax Act 1990 rules, NTN formats, and 18% / 3% tax calculations.
          </p>
        </div>

        <button
          onClick={handleRunFullValidation}
          disabled={isValidating || invoices.length === 0}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
          <span>{isValidating ? 'Running Validation...' : `Revalidate All (${invoices.length})`}</span>
        </button>
      </div>

      {/* Validation Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs">
          <div className="text-xs font-bold text-stone-600">Total Blocking Errors</div>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-2">{totalErrors}</div>
          <div className="text-[11px] text-stone-500 mt-1 font-medium">Must be fixed before PRAL submission</div>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs">
          <div className="text-xs font-bold text-stone-600">Total Warnings</div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-2">{totalWarnings}</div>
          <div className="text-[11px] text-stone-500 mt-1 font-medium">Non-blocking advisory checks</div>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs">
          <div className="text-xs font-bold text-stone-600">Valid Invoices</div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">
            {invoices.filter((i) => i.validationStatus === 'valid').length}
          </div>
          <div className="text-[11px] text-stone-500 mt-1 font-medium">Ready for FBR submission</div>
        </div>
      </div>

      {/* Active Rules Matrix */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-stone-900">Active Statutory Validation Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-stone-700">
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1">
            <div className="font-bold text-stone-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ST-18-CALC: Sales Tax Calculation (18%)</span>
            </div>
            <p className="text-stone-600">Verifies that Sales Tax Amount = Taxable Value × 18% within 1.00 PKR tolerance.</p>
          </div>

          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1">
            <div className="font-bold text-stone-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>FT-3-UNREG: Further Tax Enforcement (3%)</span>
            </div>
            <p className="text-stone-600">Enforces 3% Further Tax under Section 3(1A) on supplies to unregistered persons.</p>
          </div>

          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1">
            <div className="font-bold text-stone-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>NTN-FMT-CHK: NTN / CNIC Format Integrity</span>
            </div>
            <p className="text-stone-600">Validates 7-8 digit NTN checksum and 13-digit national CNIC formatting.</p>
          </div>

          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1">
            <div className="font-bold text-stone-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>HS-8DIG-TARIFF: Pakistan Customs Tariff Codes</span>
            </div>
            <p className="text-stone-600">Ensures item HS codes match valid chapters and 8-digit tariff classifications.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
