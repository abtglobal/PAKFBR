import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Send,
  CheckCircle2,
  AlertOctagon,
  Eye,
  Trash2,
  FileSpreadsheet,
  FileText,
  Clock,
  Check,
  ChevronDown,
  FileDown,
  Loader2,
  Plus
} from 'lucide-react';
import { NormalizedInvoice, Workspace, InvoiceStatus } from '../types/fbr';
import { validationEngine } from '../services/validationEngine';
import { fbrSubmissionAdapter } from '../services/fbrSubmissionAdapter';
import { downloadInvoicePDF, downloadBatchInvoicesPDF } from '../services/pdfService';

interface InvoicesListViewProps {
  invoices: NormalizedInvoice[];
  workspace: Workspace;
  onSelectInvoice: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
  onUpdateInvoices: (invoices: NormalizedInvoice[]) => void;
  onImportClick: () => void;
  onNewInvoiceClick: () => void;
}

export function InvoicesListView({
  invoices,
  workspace,
  onSelectInvoice,
  onDeleteInvoice,
  onUpdateInvoices,
  onImportClick,
  onNewInvoiceClick,
}: InvoicesListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [validationFilter, setValidationFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isBatchPdfDownloading, setIsBatchPdfDownloading] = useState(false);

  // Filtering
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.buyer.ntn && inv.buyer.ntn.includes(searchTerm)) ||
      (inv.buyer.cnic && inv.buyer.cnic.includes(searchTerm));

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesVal =
      validationFilter === 'ALL' ||
      (validationFilter === 'VALID' && inv.validationStatus === 'valid') ||
      (validationFilter === 'INVALID' && inv.validationStatus === 'invalid');

    return matchesSearch && matchesStatus && matchesVal;
  });

  // Select all checkbox
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInvoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvoices.map((i) => i.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Run Batch Validation on Selected
  const handleBatchValidate = () => {
    const targetInvoices = selectedIds.length > 0
      ? invoices.filter((inv) => selectedIds.includes(inv.id))
      : invoices;

    const { validatedInvoices, summary } = validationEngine.validateBatch(targetInvoices);

    const updated = invoices.map((existing) => {
      const found = validatedInvoices.find((v) => v.id === existing.id);
      return found || existing;
    });

    onUpdateInvoices(updated);
    alert(`Validation Complete: ${summary.validCount} valid, ${summary.invalidCount} invalid with ${summary.errorCount} blocking errors.`);
  };

  // Batch Submit to FBR
  const handleBatchSubmit = async () => {
    const targetInvoices = selectedIds.length > 0
      ? invoices.filter((inv) => selectedIds.includes(inv.id))
      : invoices.filter((inv) => inv.status === 'VALIDATED' || inv.status === 'READY');

    const invalidBlocking = targetInvoices.filter((inv) =>
      inv.validationErrors.some((e) => e.severity === 'ERROR')
    );

    if (invalidBlocking.length > 0) {
      alert(`Cannot submit batch: ${invalidBlocking.length} invoice(s) contain blocking errors. Fix errors before submitting.`);
      return;
    }

    if (targetInvoices.length === 0) {
      alert('No eligible validated invoices selected for submission.');
      return;
    }

    setIsBatchRunning(true);
    try {
      const { updatedInvoices } = await fbrSubmissionAdapter.submitBatch(targetInvoices, workspace);

      const allUpdated = invoices.map((existing) => {
        const match = updatedInvoices.find((u) => u.id === existing.id);
        return match || existing;
      });

      onUpdateInvoices(allUpdated);
      setSelectedIds([]);
      alert(`FBR Batch Submission complete for ${updatedInvoices.length} invoices.`);
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsBatchRunning(false);
    }
  };

  // Download Single Invoice PDF
  const handleDownloadSinglePdf = async (inv: NormalizedInvoice) => {
    setDownloadingId(inv.id);
    try {
      await downloadInvoicePDF(inv, workspace);
    } catch (err: any) {
      alert('Error generating PDF: ' + (err?.message || err));
    } finally {
      setDownloadingId(null);
    }
  };

  // Download Batch PDF
  const handleDownloadBatchPdf = async () => {
    const targets = selectedIds.length > 0
      ? invoices.filter((i) => selectedIds.includes(i.id))
      : filteredInvoices;

    if (targets.length === 0) {
      alert('No invoices found to export as PDF.');
      return;
    }

    setIsBatchPdfDownloading(true);
    try {
      await downloadBatchInvoicesPDF(targets, workspace);
    } catch (err: any) {
      alert('Error generating batch PDF: ' + (err?.message || err));
    } finally {
      setIsBatchPdfDownloading(false);
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredInvoices, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Invoices_${workspace.profile.ntn}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Search & Filter Bar - Crisp White with Amber Highlights */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by invoice number, buyer name, NTN, CNIC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-stone-50 border border-stone-300 text-xs text-stone-900 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="ALL">All FBR Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="VALIDATED">VALIDATED</option>
            <option value="READY">READY</option>
            <option value="ACCEPTED">ACCEPTED (FBR)</option>
            <option value="REJECTED">REJECTED (FBR)</option>
            <option value="FAILED">FAILED</option>
          </select>

          <select
            value={validationFilter}
            onChange={(e) => setValidationFilter(e.target.value)}
            className="bg-stone-50 border border-stone-300 text-xs text-stone-900 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="ALL">All Validation States</option>
            <option value="VALID">Valid (0 Errors)</option>
            <option value="INVALID">Invalid (Has Errors)</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedIds.length > 0 && (
            <span className="text-xs text-amber-900 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 font-bold mr-1">
              {selectedIds.length} selected
            </span>
          )}

          {/* 1-Click Download PDF button */}
          <button
            onClick={handleDownloadBatchPdf}
            disabled={isBatchPdfDownloading || filteredInvoices.length === 0}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download statutory PDF for selected or all invoices"
          >
            {isBatchPdfDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            <span>
              {isBatchPdfDownloading
                ? 'Exporting PDF...'
                : `Download PDF ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`}
            </span>
          </button>

          <button
            onClick={handleBatchValidate}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl border border-stone-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Validate {selectedIds.length > 0 ? `(${selectedIds.length})` : 'All'}</span>
          </button>

          <button
            onClick={handleBatchSubmit}
            disabled={isBatchRunning}
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-amber-400" />
            <span>{isBatchRunning ? 'Transmitting...' : `Submit FBR ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`}</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl border border-stone-300 transition-colors cursor-pointer"
            title="Export JSON"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Invoices Table - Pure White, High Contrast */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-700 font-bold select-none">
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredInvoices.length && filteredInvoices.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </th>
                <th className="p-3.5">Invoice No</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Buyer Name</th>
                <th className="p-3.5">Buyer NTN/CNIC</th>
                <th className="p-3.5 text-right">Items</th>
                <th className="p-3.5 text-right">Taxable (PKR)</th>
                <th className="p-3.5 text-right">ST (18%)</th>
                <th className="p-3.5 text-right">Grand Total (PKR)</th>
                <th className="p-3.5 text-center">Validation</th>
                <th className="p-3.5 text-center">FBR Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-900 font-sans text-xs">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-12 text-center text-stone-500 font-sans">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-stone-300" />
                    <div className="text-base font-bold text-stone-800">No Invoices Found</div>
                    <div className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                      There are no invoices matching your filters. Create a new invoice or upload an Excel file.
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <button
                        onClick={onImportClick}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                        <span>Upload Excel</span>
                      </button>
                      <button
                        onClick={onNewInvoiceClick}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Invoice</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isSelected = selectedIds.includes(inv.id);
                  const hasBlockingErrors = inv.validationErrors.some((e) => e.severity === 'ERROR');

                  return (
                    <tr
                      key={inv.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-amber-50/70' : 'hover:bg-stone-50/80'
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(inv.id)}
                          className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>

                      <td className="p-3.5 font-bold font-mono text-stone-900">
                        <button
                          onClick={() => onSelectInvoice(inv.id)}
                          className="hover:text-amber-700 hover:underline text-left cursor-pointer"
                        >
                          {inv.invoiceNumber}
                        </button>
                      </td>

                      <td className="p-3.5 text-stone-600">{inv.invoiceDate}</td>

                      <td className="p-3.5 font-semibold text-stone-900 max-w-[180px] truncate">
                        {inv.buyer.name}
                      </td>

                      <td className="p-3.5 font-mono text-stone-600">
                        {inv.buyer.ntn || inv.buyer.cnic || (
                          <span className="text-stone-400 italic">Unregistered</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right font-mono text-stone-700">
                        {inv.items.length}
                      </td>

                      <td className="p-3.5 text-right font-mono text-stone-700 tabular-nums">
                        {inv.summary.totalTaxableValue.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3.5 text-right font-mono font-semibold text-amber-800 tabular-nums">
                        {inv.summary.totalSalesTax.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3.5 text-right font-bold font-mono text-stone-950 tabular-nums text-sm">
                        {inv.summary.grandTotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3.5 text-center">
                        {hasBlockingErrors ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                            INVALID ({inv.validationErrors.filter((e) => e.severity === 'ERROR').length})
                          </span>
                        ) : inv.validationStatus === 'valid' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            VALID
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] text-stone-600 bg-stone-100 border border-stone-200">
                            UNCHECKED
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inv.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                          inv.status === 'VALIDATED' || inv.status === 'READY' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                          inv.status === 'REJECTED' || inv.status === 'FAILED' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                          'bg-stone-100 text-stone-700 border border-stone-300'
                        }`}>
                          {inv.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDownloadSinglePdf(inv)}
                            disabled={downloadingId === inv.id}
                            className="p-1.5 text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                            title="Download Invoice (PDF)"
                          >
                            {downloadingId === inv.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                            ) : (
                              <FileDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => onSelectInvoice(inv.id)}
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                            title="Inspect Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteInvoice(inv.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
