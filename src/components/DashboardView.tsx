import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Send,
  CheckCheck,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
  Building2,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Receipt,
  FileDown,
  Loader2,
  Monitor,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { NormalizedInvoice, Workspace, AuditEntry } from '../types/fbr';
import { downloadInvoicePDF } from '../services/pdfService';

interface DashboardViewProps {
  invoices: NormalizedInvoice[];
  workspace: Workspace;
  auditLogs: AuditEntry[];
  onNavigate: (tab: any) => void;
  onSelectInvoice: (invoiceId: string) => void;
}

export function DashboardView({
  invoices,
  workspace,
  auditLogs,
  onNavigate,
  onSelectInvoice,
}: DashboardViewProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Metric aggregations
  const totalInvoices = invoices.length;
  const validInvoices = invoices.filter((inv) => inv.validationStatus === 'valid').length;
  const invalidInvoices = invoices.filter((inv) => inv.validationStatus === 'invalid').length;
  const pendingSubmission = invoices.filter(
    (inv) => inv.status === 'VALIDATED' || inv.status === 'READY'
  ).length;
  const acceptedInvoices = invoices.filter((inv) => inv.status === 'ACCEPTED').length;
  const rejectedInvoices = invoices.filter((inv) => inv.status === 'REJECTED').length;
  const failedInvoices = invoices.filter((inv) => inv.status === 'FAILED').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayInvoices = invoices.filter((inv) => inv.invoiceDate === todayStr);

  // Financial calculations
  const totalTaxable = invoices.reduce((sum, inv) => sum + inv.summary.totalTaxableValue, 0);
  const totalSalesTax = invoices.reduce((sum, inv) => sum + inv.summary.totalSalesTax, 0);
  const totalFurtherTax = invoices.reduce((sum, inv) => sum + inv.summary.totalFurtherTax, 0);
  const totalGrandAmount = invoices.reduce((sum, inv) => sum + inv.summary.grandTotal, 0);

  const complianceRate = totalInvoices > 0 ? Math.round((acceptedInvoices / totalInvoices) * 100) : 0;

  const handleDownloadPdf = async (e: React.MouseEvent, inv: NormalizedInvoice) => {
    e.stopPropagation();
    setDownloadingId(inv.id);
    try {
      await downloadInvoicePDF(inv, workspace);
    } catch (err: any) {
      alert('Error downloading PDF: ' + (err?.message || err));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Company Banner - Rich Amber Gold */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 rounded-2xl p-6 text-white shadow-lg shadow-amber-500/10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center text-white shrink-0 backdrop-blur-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold tracking-tight text-white">
                {workspace.profile.businessName || 'Taxpayer Entity (Unconfigured)'}
              </h2>
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 bg-white/20 text-white rounded-md border border-white/20">
                NTN: {workspace.profile.ntn || 'Unconfigured'}
              </span>
            </div>
            <div className="text-xs text-amber-100 mt-1 flex items-center gap-3 flex-wrap font-medium">
              <span>STRN: <span className="font-mono font-bold text-white">{workspace.profile.strn || 'Not Set'}</span></span>
              <span>·</span>
              <span>POS ID: <span className="font-mono font-bold text-white">{workspace.profile.posId || 'Not Set'}</span></span>
              <span>·</span>
              <span>City: <span className="font-semibold text-white">{workspace.profile.city || 'Not Set'}</span></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('IMPORT')}
            className="px-4 py-2 bg-white hover:bg-stone-50 text-amber-900 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
            <span>Import Excel</span>
          </button>
          <button
            onClick={() => onNavigate('SUBMISSION')}
            className="px-4 py-2 bg-amber-900/40 hover:bg-amber-900/60 text-white text-xs font-bold rounded-xl border border-white/30 transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
          >
            <Send className="w-4 h-4 text-amber-200" />
            <span>Submit Queue ({pendingSubmission})</span>
          </button>
        </div>
      </div>

      {/* Simple 3-Step Taxpayer Guide (Direct, Clear, Easy) */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Quick 3-Step Compliance Workflow
            </h3>
          </div>
          <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Simplified Mode
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1 */}
          <div
            onClick={() => onNavigate('SETTINGS')}
            className="p-4 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50/50 hover:bg-amber-50/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">1</span>
              <span className="text-[10px] font-bold text-stone-500 uppercase">Profile</span>
            </div>
            <h4 className="text-xs font-bold text-stone-900 group-hover:text-amber-800">1. Setup Taxpayer Details</h4>
            <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
              Verify your company NTN, STRN, and legal business name for official statutory tax invoices.
            </p>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => onNavigate('IMPORT')}
            className="p-4 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50/50 hover:bg-amber-50/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">2</span>
              <span className="text-[10px] font-bold text-stone-500 uppercase">Ingestion</span>
            </div>
            <h4 className="text-xs font-bold text-stone-900 group-hover:text-amber-800">2. Ingest or Create Invoice</h4>
            <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
              Upload your sales spreadsheet (.xlsx / .csv) or click "+ Create Invoice" for manual entry.
            </p>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => onNavigate('INVOICES')}
            className="p-4 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50/50 hover:bg-amber-50/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">3</span>
              <span className="text-[10px] font-bold text-stone-500 uppercase">Output & Filing</span>
            </div>
            <h4 className="text-xs font-bold text-stone-900 group-hover:text-amber-800">3. Download PDF & Submit FBR</h4>
            <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
              Download high-resolution vector PDF invoices with FBR QR Code or batch transmit to PRAL.
            </p>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid - High Visibility Crisp White Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-stone-600 flex items-center justify-between">
            <span>Total Invoices</span>
            <FileText className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-2">
            {totalInvoices}
          </div>
          <div className="text-[10px] text-stone-500 mt-1 font-medium">In Workspace</div>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-700 flex items-center justify-between">
            <span>Valid Invoices</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-2">
            {validInvoices}
          </div>
          <div className="text-[10px] text-stone-500 mt-1 font-medium">0 Errors</div>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-rose-700 flex items-center justify-between">
            <span>Invalid Errors</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-700 mt-2">
            {invalidInvoices}
          </div>
          <div className="text-[10px] text-stone-500 mt-1 font-medium">Needs Fix</div>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-amber-700 flex items-center justify-between">
            <span>Pending Submit</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-2">
            {pendingSubmission}
          </div>
          <div className="text-[10px] text-stone-500 mt-1 font-medium">Ready for FBR</div>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-blue-700 flex items-center justify-between">
            <span>FBR Accepted</span>
            <CheckCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-blue-700 mt-2">
            {acceptedInvoices}
          </div>
          <div className="text-[10px] text-stone-500 mt-1 font-medium">IRN Issued</div>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-stone-600 flex items-center justify-between">
            <span>Rejected / Failed</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 mt-2">
            {rejectedInvoices + failedInvoices}
          </div>
          <div className="text-[10px] text-stone-500 mt-1 font-medium">Review PRAL</div>
        </div>
      </div>

      {/* Tax Liability & Compliance Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tax Summary */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Sales Tax Liability Summary</h3>
              <p className="text-xs text-stone-600 font-medium">Calculated under Pakistan Sales Tax Act 1990</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-amber-50 text-amber-900 rounded-lg border border-amber-200">
              PKR Currency
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl">
              <div className="text-[11px] font-semibold text-stone-600">Taxable Value</div>
              <div className="text-sm font-bold font-mono tabular-nums text-stone-900 mt-1">
                PKR {totalTaxable.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-amber-50/60 border border-amber-200 p-3.5 rounded-xl">
              <div className="text-[11px] font-bold text-amber-900">Sales Tax (18%)</div>
              <div className="text-sm font-bold font-mono tabular-nums text-amber-800 mt-1">
                PKR {totalSalesTax.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl">
              <div className="text-[11px] font-semibold text-amber-800">Further Tax (3%)</div>
              <div className="text-sm font-bold font-mono tabular-nums text-stone-900 mt-1">
                PKR {totalFurtherTax.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-amber-100 border border-amber-300 p-3.5 rounded-xl text-stone-900">
              <div className="text-[11px] text-amber-900 font-bold">Total Invoiced</div>
              <div className="text-sm font-bold font-mono tabular-nums text-amber-900 mt-1">
                PKR {totalGrandAmount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Compliance Status Progress Bar */}
          <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-800 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>FBR Registration & Transmission Rate</span>
              </span>
              <span className="font-mono font-bold text-amber-800 tabular-nums">{complianceRate}% Accepted</span>
            </div>
            <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden flex">
              <div style={{ width: `${(acceptedInvoices / (totalInvoices || 1)) * 100}%` }} className="bg-amber-500 h-full"></div>
              <div style={{ width: `${(pendingSubmission / (totalInvoices || 1)) * 100}%` }} className="bg-amber-300 h-full"></div>
              <div style={{ width: `${(invalidInvoices / (totalInvoices || 1)) * 100}%` }} className="bg-rose-400 h-full"></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-600 font-medium pt-1">
              <span>{acceptedInvoices} Accepted with IRN</span>
              <span>{pendingSubmission} In Pipeline</span>
              <span>{invalidInvoices} Invalid Errors</span>
            </div>
          </div>
        </div>

        {/* Quick Operations Card */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-stone-900">Compliance Utilities</h3>

          <div className="space-y-2.5">
            <button
              onClick={() => onNavigate('SETTINGS')}
              className="w-full text-left p-3 rounded-xl border border-amber-300 bg-amber-50/50 hover:bg-amber-100/60 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900 group-hover:text-amber-900">Taxpayer Profile & Settings</div>
                  <div className="text-[10px] text-stone-600 font-medium">Configure NTN, STRN, and Jurisdictions</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('INVOICES')}
              className="w-full text-left p-3 rounded-xl border border-stone-200 hover:border-amber-300 bg-stone-50/50 hover:bg-stone-50 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-stone-800 text-white flex items-center justify-center font-bold">
                  <FileDown className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">Invoices & PDF Hub</div>
                  <div className="text-[10px] text-stone-600 font-medium">Download single or batch PDFs</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('TAX_CONFIG')}
              className="w-full text-left p-3 rounded-xl border border-stone-200 hover:border-amber-300 bg-stone-50/50 hover:bg-stone-50 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-stone-200 text-stone-800 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">Tariff & Tax Schedules</div>
                  <div className="text-[10px] text-stone-600 font-medium">18% ST, 3% Further Tax & HS Codes</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table with Direct PDF Action */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Recent Invoices</h3>
            <p className="text-xs text-stone-600 font-medium">Quick inspection and 1-click statutory PDF download</p>
          </div>
          <button
            onClick={() => onNavigate('INVOICES')}
            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>View All ({invoices.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100/70 border-b border-stone-200 text-stone-700 font-bold">
                <th className="p-3">Invoice No</th>
                <th className="p-3">Date</th>
                <th className="p-3">Buyer Name</th>
                <th className="p-3 text-right">Taxable (PKR)</th>
                <th className="p-3 text-right">Total (PKR)</th>
                <th className="p-3 text-center">FBR Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-900 font-sans text-xs">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-500 font-sans">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-stone-400" />
                    <div className="text-sm font-bold text-stone-800">No Invoices Ingested Yet</div>
                    <div className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                      Upload your first Excel spreadsheet or create an invoice to start generating PDFs.
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <button
                        onClick={() => onNavigate('IMPORT')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                      >
                        Import Excel
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.slice(0, 5).map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv.id)}
                    className="hover:bg-amber-50/50 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-bold font-mono text-stone-900">{inv.invoiceNumber}</td>
                    <td className="p-3 text-stone-600">{inv.invoiceDate}</td>
                    <td className="p-3 text-stone-900 font-medium truncate max-w-[160px]">{inv.buyer.name}</td>
                    <td className="p-3 text-right font-mono text-stone-700 tabular-nums">
                      {inv.summary.totalTaxableValue.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-amber-800 tabular-nums">
                      {inv.summary.grandTotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                        inv.status === 'VALIDATED' || inv.status === 'READY' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                        inv.status === 'REJECTED' || inv.status === 'FAILED' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                        'bg-stone-100 text-stone-700 border border-stone-300'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => handleDownloadPdf(e, inv)}
                        disabled={downloadingId === inv.id}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                        title="Download Invoice PDF"
                      >
                        {downloadingId === inv.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-amber-700" />
                        ) : (
                          <FileDown className="w-3 h-3 text-amber-700" />
                        )}
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
