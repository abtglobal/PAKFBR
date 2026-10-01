import React, { useState } from 'react';
import {
  Send,
  CheckCircle2,
  AlertOctagon,
  Clock,
  ExternalLink,
  Receipt,
  FileText,
  Search,
  CheckCheck,
  RefreshCw,
  QrCode,
  FileDown
} from 'lucide-react';
import { NormalizedInvoice, Workspace } from '../types/fbr';
import { fbrSubmissionAdapter } from '../services/fbrSubmissionAdapter';
import { downloadInvoicePDF } from '../services/pdfService';

export function SubmissionQueueView({
  invoices,
  workspace,
  onUpdateInvoices,
  onSelectInvoice,
}: {
  invoices: NormalizedInvoice[];
  workspace: Workspace;
  onUpdateInvoices: (invoices: NormalizedInvoice[]) => void;
  onSelectInvoice: (id: string) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const eligibleInvoices = invoices.filter(
    (i) => i.status === 'VALIDATED' || i.status === 'READY' || i.status === 'FAILED'
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === eligibleInvoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(eligibleInvoices.map((i) => i.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBatchSubmit = async () => {
    const targets = selectedIds.length > 0
      ? eligibleInvoices.filter((i) => selectedIds.includes(i.id))
      : eligibleInvoices;

    if (targets.length === 0) {
      alert('No eligible validated invoices selected for submission.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { updatedInvoices } = await fbrSubmissionAdapter.submitBatch(targets, workspace);
      const allUpdated = invoices.map((existing) => {
        const found = updatedInvoices.find((u) => u.id === existing.id);
        return found || existing;
      });
      onUpdateInvoices(allUpdated);
      setSelectedIds([]);
      alert(`Submission complete for ${updatedInvoices.length} invoices.`);
    } catch (err: any) {
      alert(`Submission error: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-1">
            <Send className="w-4 h-4 text-amber-600" />
            <span>FBR PRAL DIGITAL TRANSMISSION GATEWAY</span>
          </div>
          <h2 className="text-base font-bold text-stone-900">Submission Workbench & Queue</h2>
          <p className="text-xs text-stone-600 font-medium">Batch transmit validated invoices to FBR API for official IRN generation.</p>
        </div>

        <button
          onClick={handleBatchSubmit}
          disabled={isSubmitting || eligibleInvoices.length === 0}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? 'Transmitting to FBR...' : `Submit Queue (${selectedIds.length || eligibleInvoices.length})`}</span>
        </button>
      </div>

      {/* Queue Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold">
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === eligibleInvoices.length && eligibleInvoices.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                  />
                </th>
                <th className="p-3.5">Invoice No</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Buyer Name</th>
                <th className="p-3.5">Buyer NTN</th>
                <th className="p-3.5 text-right">Taxable (PKR)</th>
                <th className="p-3.5 text-right">Sales Tax</th>
                <th className="p-3.5 text-right">Grand Total</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-900 font-sans text-xs">
              {eligibleInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-stone-500 font-sans">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
                    <div className="text-base font-bold text-stone-800">Queue is Clear</div>
                    <div className="text-xs text-stone-500 mt-1">All invoices are either in draft state or already submitted to FBR.</div>
                  </td>
                </tr>
              ) : (
                eligibleInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50">
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(inv.id)}
                        onChange={() => toggleSelectOne(inv.id)}
                        className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                      />
                    </td>
                    <td className="p-3.5 font-bold font-mono text-stone-900">{inv.invoiceNumber}</td>
                    <td className="p-3.5 text-stone-600">{inv.invoiceDate}</td>
                    <td className="p-3.5 font-semibold text-stone-900">{inv.buyer.name}</td>
                    <td className="p-3.5 font-mono text-stone-600">{inv.buyer.ntn || 'N/A'}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-stone-900">{inv.summary.totalTaxableValue.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-amber-800">{inv.summary.totalSalesTax.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-stone-950">{inv.summary.grandTotal.toFixed(2)}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => onSelectInvoice(inv.id)}
                        className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Inspect
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

export function FBRResponsesView({
  invoices,
  onSelectInvoice,
}: {
  invoices: NormalizedInvoice[];
  onSelectInvoice: (id: string) => void;
}) {
  const submittedInvoices = invoices.filter((i) => i.fbrSubmission);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
        <h2 className="text-base font-bold text-stone-900">FBR Responses & Official IRN Registry</h2>
        <p className="text-xs text-stone-600 font-medium mt-0.5">
          Official PRAL gateway acknowledgement logs, cryptographic digital verification QR records, and IRNs.
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold">
                <th className="p-3.5">Invoice No</th>
                <th className="p-3.5">Official FBR IRN</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Status Code</th>
                <th className="p-3.5">Gateway Response Message</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-900 font-sans text-xs">
              {submittedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-stone-500 font-sans">
                    <Receipt className="w-10 h-10 mx-auto mb-3 text-stone-300" />
                    <div className="text-base font-bold text-stone-800">No Responses Received Yet</div>
                    <div className="text-xs text-stone-500 mt-1">Submit invoices to the FBR Gateway to view official PRAL verification logs.</div>
                  </td>
                </tr>
              ) : (
                submittedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50">
                    <td className="p-3.5 font-bold font-mono text-stone-900">{inv.invoiceNumber}</td>
                    <td className="p-3.5 font-mono font-bold text-amber-900">{inv.fbrSubmission?.irn || 'PENDING'}</td>
                    <td className="p-3.5 text-stone-600 font-mono text-[11px]">{inv.fbrSubmission?.submittedAt}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.fbrSubmission?.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                      }`}>
                        {inv.fbrSubmission?.statusCode} {inv.fbrSubmission?.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-stone-700 max-w-xs truncate font-medium">{inv.fbrSubmission?.responseMessage}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => onSelectInvoice(inv.id)}
                        className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-lg border border-amber-200 transition-colors cursor-pointer"
                      >
                        Inspect IRN
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
