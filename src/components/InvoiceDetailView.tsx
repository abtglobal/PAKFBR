import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Printer,
  FileJson,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  Clock,
  QrCode,
  Send,
  Building2,
  Copy,
  Check,
  Download,
  Receipt,
  ExternalLink,
  FileDown,
  Loader2
} from 'lucide-react';
import { NormalizedInvoice, Workspace } from '../types/fbr';
import { transformToFBRPayload } from '../services/fbrTransformer';
import { fbrSubmissionAdapter } from '../services/fbrSubmissionAdapter';
import { downloadInvoicePDF } from '../services/pdfService';
import QRCode from 'qrcode';

interface InvoiceDetailViewProps {
  invoice: NormalizedInvoice;
  workspace: Workspace;
  onBack: () => void;
  onUpdateInvoice: (invoice: NormalizedInvoice) => void;
}

export function InvoiceDetailView({
  invoice,
  workspace,
  onBack,
  onUpdateInvoice,
}: InvoiceDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FBR_PAYLOAD' | 'PRINT_PREVIEW' | 'AUDIT'>('OVERVIEW');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const fbrPayload = transformToFBRPayload(invoice, workspace);

  // Generate QR code for on-screen preview
  useEffect(() => {
    const qrDataText = `FBR-IRN:${invoice.fbrSubmission?.irn || 'PENDING'}|INV:${invoice.invoiceNumber}|SELLER:${invoice.seller.ntn}|BUYER:${invoice.buyer.ntn || invoice.buyer.cnic || 'UNREG'}|DATE:${invoice.invoiceDate}|TOTAL:${invoice.summary.grandTotal}|TAX:${invoice.summary.totalSalesTax}`;
    QRCode.toDataURL(qrDataText, {
      margin: 1,
      width: 160,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => setQrCodeUrl(url))
      .catch(() => {});
  }, [invoice]);

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await downloadInvoicePDF(invoice, workspace);
    } catch (err: any) {
      alert(`PDF Generation error: ${err?.message || err}`);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Handle single invoice submission
  const handleSubmitToFBR = async () => {
    setIsSubmitting(true);
    try {
      const { updatedInvoice, result } = await fbrSubmissionAdapter.submitInvoice(invoice, workspace);
      onUpdateInvoice(updatedInvoice);
      alert(`FBR Response: ${result.responseMessage}`);
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPayloadToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(fbrPayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const hasBlockingErrors = invoice.validationErrors.some((e) => e.severity === 'ERROR');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4 bg-white p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl border border-stone-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-stone-900 font-mono">{invoice.invoiceNumber}</h1>
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                invoice.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                invoice.status === 'VALIDATED' || invoice.status === 'READY' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                invoice.status === 'REJECTED' || invoice.status === 'FAILED' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                'bg-stone-100 text-stone-700 border border-stone-300'
              }`}>
                {invoice.status}
              </span>
              <span className="text-xs text-stone-600 font-mono">Date: {invoice.invoiceDate}</span>
            </div>
            <div className="text-xs text-stone-600 mt-1 font-medium">
              Source: <span className="text-stone-900 capitalize font-semibold">{invoice.source.replace('_', ' ')}</span>
              {invoice.sourceFile && ` · File: ${invoice.sourceFile}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Direct 1-Click Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download statutory Pakistan Sales Tax Invoice in PDF"
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            <span>{isDownloadingPdf ? 'Creating PDF...' : 'Download Invoice (PDF)'}</span>
          </button>

          {/* Submission Trigger */}
          {invoice.status !== 'ACCEPTED' && (
            <button
              onClick={handleSubmitToFBR}
              disabled={isSubmitting || hasBlockingErrors}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer ${
                hasBlockingErrors
                  ? 'bg-stone-200 text-stone-500 cursor-not-allowed border border-stone-300'
                  : 'bg-stone-900 hover:bg-stone-800 text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span>{isSubmitting ? 'Transmitting...' : 'Submit to FBR'}</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('PRINT_PREVIEW')}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-stone-600" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-1 bg-white border border-stone-200 p-1.5 rounded-2xl w-fit shadow-xs">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'OVERVIEW' ? 'bg-amber-500 text-white shadow-xs' : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
          }`}
        >
          Invoice Details & Items
        </button>
        <button
          onClick={() => setActiveTab('PRINT_PREVIEW')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'PRINT_PREVIEW' ? 'bg-amber-500 text-white shadow-xs' : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
          }`}
        >
          Printable Tax Invoice & PDF
        </button>
        <button
          onClick={() => setActiveTab('FBR_PAYLOAD')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'FBR_PAYLOAD' ? 'bg-amber-500 text-white shadow-xs' : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
          }`}
        >
          FBR JSON Payload
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'AUDIT' ? 'bg-amber-500 text-white shadow-xs' : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
          }`}
        >
          Audit History ({invoice.auditTrail?.length || 0})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Parties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seller */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-xs font-bold text-amber-900 uppercase">Seller / Taxpayer Entity</span>
                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Registered</span>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-stone-900">{invoice.seller.name}</div>
                <div className="text-xs text-stone-600">{invoice.seller.address}, {invoice.seller.city}, {invoice.seller.province}</div>
                <div className="text-xs font-mono font-bold text-stone-900 pt-1">
                  NTN: {invoice.seller.ntn} · STRN: {invoice.seller.strn || 'N/A'}
                </div>
              </div>
            </div>

            {/* Buyer */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-xs font-bold text-stone-700 uppercase">Buyer / Customer</span>
                <span className="text-[10px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200 uppercase">
                  {invoice.buyer.type.replace('_', ' ')}
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-stone-900">{invoice.buyer.name}</div>
                <div className="text-xs text-stone-600">{invoice.buyer.address || 'Address on file'}</div>
                <div className="text-xs font-mono font-bold text-stone-900 pt-1">
                  NTN: {invoice.buyer.ntn || 'N/A'} · CNIC: {invoice.buyer.cnic || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Line Items & Tariff Schedule</h3>
              <span className="text-xs font-bold text-stone-700">{invoice.items.length} Items</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200 font-bold text-stone-700">
                    <th className="p-3">#</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">HS Code</th>
                    <th className="p-3">UOM</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Taxable Val</th>
                    <th className="p-3 text-right">ST Rate</th>
                    <th className="p-3 text-right">Sales Tax</th>
                    <th className="p-3 text-right">Further Tax</th>
                    <th className="p-3 text-right">Total (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-900 font-sans text-xs">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-stone-50">
                      <td className="p-3 text-stone-500">{idx + 1}</td>
                      <td className="p-3 font-semibold text-stone-900">{item.description}</td>
                      <td className="p-3 font-mono text-stone-700">{item.hsCode}</td>
                      <td className="p-3 text-stone-600">{item.uom}</td>
                      <td className="p-3 text-right font-mono text-stone-800">{item.quantity}</td>
                      <td className="p-3 text-right font-mono text-stone-800">{item.unitPrice.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono font-bold text-stone-900">{item.taxableValue.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-stone-700">{item.salesTaxRate}%</td>
                      <td className="p-3 text-right font-mono font-bold text-amber-800">{item.salesTaxAmount.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-stone-700">{item.furtherTaxAmount.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono font-bold text-stone-950">{item.totalAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tax Calculation Reconciliation Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-2 max-w-md text-xs text-stone-600">
              <h4 className="font-bold text-stone-900">FBR Statutory Legal Reference</h4>
              <p className="leading-relaxed">
                Sales Tax is charged under the Sales Tax Act 1990. Invoices submitted to FBR will receive a 
                verifiable Invoice Reference Number (IRN) and cryptographic QR code.
              </p>
              {invoice.referenceNumber && (
                <div className="font-mono font-bold text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  Adjustment Reference: {invoice.referenceNumber}
                </div>
              )}
            </div>

            {/* Calculations Total Column */}
            <div className="w-full md:w-80 space-y-2 text-xs font-mono bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div className="flex justify-between text-stone-600">
                <span>Gross Value (Excl. Tax):</span>
                <span className="text-stone-900 font-bold tabular-nums">PKR {invoice.summary.subtotalExclTax.toFixed(2)}</span>
              </div>
              {invoice.summary.totalDiscount > 0 && (
                <div className="flex justify-between text-rose-700">
                  <span>Trade Discount:</span>
                  <span className="tabular-nums">- PKR {invoice.summary.totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-900 font-bold border-t border-stone-300 pt-1">
                <span>Taxable Value:</span>
                <span className="tabular-nums">PKR {invoice.summary.totalTaxableValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-800 font-bold">
                <span>Sales Tax (18%):</span>
                <span className="tabular-nums">PKR {invoice.summary.totalSalesTax.toFixed(2)}</span>
              </div>
              {invoice.summary.totalFurtherTax > 0 && (
                <div className="flex justify-between text-amber-900 font-bold">
                  <span>Further Tax (3% Sec 3(1A)):</span>
                  <span className="tabular-nums">PKR {invoice.summary.totalFurtherTax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-stone-950 border-t-2 border-stone-400 pt-2">
                <span>Grand Total:</span>
                <span className="text-amber-800 tabular-nums">PKR {invoice.summary.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRINT PREVIEW & DIRECT PDF */}
      {activeTab === 'PRINT_PREVIEW' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print bg-white border border-stone-200 p-4 rounded-2xl shadow-xs">
            <div className="text-xs text-stone-700 font-bold">
              Statutory Sales Tax Invoice (Pakistan Sales Tax Act 1990 & Digital Invoicing Rules)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Download high-resolution vector PDF"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Invoice (PDF)'}</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-stone-600" />
                <span>Print / Save via Browser</span>
              </button>
            </div>
          </div>

          {/* Printable Invoice Sheet */}
          <div className="bg-white text-stone-900 p-8 rounded-2xl border border-stone-300 shadow-md max-w-4xl mx-auto space-y-6 print:p-0 print:border-none print:shadow-none print:max-w-none text-xs">
            {/* Header */}
            <div className="border-b-2 border-stone-900 pb-4 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold uppercase tracking-tight text-stone-900">{invoice.seller.name}</h1>
                <div className="text-stone-700 mt-1 font-medium">{invoice.seller.address}, {invoice.seller.city}, {invoice.seller.province}</div>
                <div className="font-mono mt-1 font-bold text-stone-900">
                  <span>NTN: {invoice.seller.ntn}</span>
                  <span className="mx-2">·</span>
                  <span>STRN: {invoice.seller.strn || 'N/A'}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold uppercase tracking-wider text-amber-800">SALES TAX INVOICE</div>
                <div className="font-mono font-bold text-sm mt-1">NO: {invoice.invoiceNumber}</div>
                <div className="text-stone-700 font-mono mt-0.5 font-semibold">Date: {invoice.invoiceDate}</div>
                <div className="text-stone-600 text-[10px] font-mono mt-0.5">POS: {workspace.fbrConfig.posId}</div>
              </div>
            </div>

            {/* Buyer Block */}
            <div className="grid grid-cols-2 gap-4 border border-stone-300 p-4 rounded-xl bg-stone-50/50">
              <div>
                <div className="font-bold uppercase text-[10px] text-stone-600">BUYER / CUSTOMER:</div>
                <div className="font-bold text-sm text-stone-900 mt-0.5">{invoice.buyer.name}</div>
                <div className="text-stone-700 mt-0.5">{invoice.buyer.address}</div>
              </div>
              <div className="font-mono space-y-1">
                <div><span className="text-stone-600">Buyer NTN:</span> <span className="font-bold text-stone-900">{invoice.buyer.ntn || 'N/A'}</span></div>
                <div><span className="text-stone-600">Buyer CNIC:</span> <span className="font-bold text-stone-900">{invoice.buyer.cnic || 'N/A'}</span></div>
                <div><span className="text-stone-600">Buyer Status:</span> <span className="uppercase font-bold text-stone-900">{invoice.buyer.type.replace('_', ' ')}</span></div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-y-2 border-stone-900 font-bold text-stone-900 bg-stone-50">
                  <th className="py-2.5 px-2">#</th>
                  <th className="py-2.5 px-2">Description</th>
                  <th className="py-2.5 px-2">HS Code</th>
                  <th className="py-2.5 px-2">UOM</th>
                  <th className="py-2.5 px-2 text-right">Qty</th>
                  <th className="py-2.5 px-2 text-right">Rate</th>
                  <th className="py-2.5 px-2 text-right">Taxable Val</th>
                  <th className="py-2.5 px-2 text-right">ST (18%)</th>
                  <th className="py-2.5 px-2 text-right">Total (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {invoice.items.map((it, idx) => (
                  <tr key={it.id}>
                    <td className="py-2 px-2 text-stone-600">{idx + 1}</td>
                    <td className="py-2 px-2 font-semibold text-stone-900">{it.description}</td>
                    <td className="py-2 px-2 font-mono text-stone-700">{it.hsCode}</td>
                    <td className="py-2 px-2 text-stone-700">{it.uom}</td>
                    <td className="py-2 px-2 text-right font-mono text-stone-900">{it.quantity}</td>
                    <td className="py-2 px-2 text-right font-mono text-stone-900">{it.unitPrice.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-stone-900">{it.taxableValue.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-amber-800">{it.salesTaxAmount.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-stone-950">{it.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals & QR Section */}
            <div className="border-t-2 border-stone-900 pt-4 flex justify-between items-end">
              <div className="flex items-center gap-3">
                <div className="w-22 h-22 bg-stone-50 border border-stone-300 flex items-center justify-center p-1 rounded-xl">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="FBR QR Code" className="w-full h-full object-contain" />
                  ) : (
                    <QrCode className="w-16 h-16 text-stone-800" />
                  )}
                </div>
                <div className="text-[10px] text-stone-600 max-w-xs space-y-0.5">
                  <div className="font-bold text-stone-900">FBR Digital Verification QR</div>
                  <div className="font-mono text-[9px] font-bold text-amber-900">IRN: {invoice.fbrSubmission?.irn || 'PK-FBR-PENDING-SUBMISSION'}</div>
                  <div className="text-stone-600">Scan via FBR Asaan Tax app or Taxpayer Verification Portal.</div>
                </div>
              </div>

              <div className="w-72 space-y-1 font-mono text-right bg-stone-50 p-3 rounded-xl border border-stone-200">
                <div className="flex justify-between"><span className="text-stone-600">Taxable Value:</span> <span className="font-bold text-stone-900">PKR {invoice.summary.totalTaxableValue.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-stone-600">Sales Tax (18%):</span> <span className="font-bold text-amber-800">PKR {invoice.summary.totalSalesTax.toFixed(2)}</span></div>
                {invoice.summary.totalFurtherTax > 0 && (
                  <div className="flex justify-between"><span className="text-stone-600">Further Tax (3%):</span> <span className="font-bold text-amber-900">PKR {invoice.summary.totalFurtherTax.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between font-bold text-sm border-t-2 border-stone-400 pt-1 text-stone-950">
                  <span>Grand Total:</span> <span>PKR {invoice.summary.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Taxpayer Disclaimer Footer */}
            <div className="border-t border-stone-200 pt-3 text-[10px] text-stone-500 text-center font-medium">
              This invoice is generated through the taxpayer's internal compliance gateway in accordance with Pakistan Sales Tax Act 1990 & Digital Invoicing Rules.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FBR TRANSFORMED PAYLOAD */}
      {activeTab === 'FBR_PAYLOAD' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Transformed FBR JSON Payload</h3>
              <p className="text-xs text-stone-600 font-medium">
                Conforms strictly to the FBR Sales Tax Digital Invoicing schema ready for transmission.
              </p>
            </div>
            <button
              onClick={copyPayloadToClipboard}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedPayload ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPayload ? 'Copied!' : 'Copy JSON'}</span>
            </button>
          </div>

          <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-5 font-mono text-xs text-stone-900 overflow-x-auto shadow-inner">
            <pre className="text-stone-800">{JSON.stringify(fbrPayload, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT HISTORY */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-stone-900">Immutable Event History</h3>
          <div className="space-y-3">
            {invoice.auditTrail?.map((entry) => (
              <div key={entry.id} className="border-l-4 border-amber-500 pl-4 py-2 bg-stone-50 p-3.5 rounded-r-xl border border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-900">{entry.action}</span>
                  <span className="font-mono text-[10px] text-stone-500">{new Date(entry.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-xs text-stone-800 font-medium mt-1">{entry.details}</div>
                <div className="text-[10px] text-stone-500 mt-1 font-semibold">User: {entry.userName}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
