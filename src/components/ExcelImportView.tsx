import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Download,
  ArrowRight,
  RefreshCw,
  Save,
  Check,
  X,
  FileText,
  HelpCircle,
  Eye,
  Trash2,
  Edit3
} from 'lucide-react';
import {
  ParsedSheetData,
  RawRowData,
  ColumnMappingConfig,
  NormalizedInvoice,
  Workspace,
  ValidationError,
} from '../types/fbr';
import {
  parseExcelOrCsvFile,
  autoSuggestColumnMapping,
  generateStandardFBRExcelTemplate,
  generateErrorReportExcel,
  CANONICAL_MAPPING_FIELDS,
} from '../services/excelParser';
import { normalizeRawRowsToInvoices } from '../services/normalizationService';
import { validationEngine } from '../services/validationEngine';

interface ExcelImportViewProps {
  workspace: Workspace;
  savedTemplates: ColumnMappingConfig[];
  onSaveTemplate: (template: ColumnMappingConfig) => void;
  onImportComplete: (invoices: NormalizedInvoice[]) => void;
  onViewInvoiceDetail: (invoiceId: string) => void;
}

type ImportStep = 'UPLOAD' | 'MAP_COLUMNS' | 'PREVIEW_VALIDATE' | 'RESOLVE_ERRORS';

export function ExcelImportView({
  workspace,
  savedTemplates,
  onSaveTemplate,
  onImportComplete,
  onViewInvoiceDetail,
}: ExcelImportViewProps) {
  const [currentStep, setCurrentStep] = useState<ImportStep>('UPLOAD');
  const [fileName, setFileName] = useState<string>('');
  const [sheets, setSheets] = useState<ParsedSheetData[]>([]);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState<number>(0);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [templateName, setTemplateName] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [normalizedInvoices, setNormalizedInvoices] = useState<NormalizedInvoice[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [editingInvoice, setEditingInvoice] = useState<NormalizedInvoice | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSheet = sheets[selectedSheetIndex];

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      setFileName(file.name);
      const parsedSheets = await parseExcelOrCsvFile(file);
      if (parsedSheets.length === 0) {
        alert('The uploaded file does not contain any readable data rows.');
        return;
      }
      setSheets(parsedSheets);
      setSelectedSheetIndex(0);

      // Auto-suggest mapping for the first sheet
      const suggested = autoSuggestColumnMapping(parsedSheets[0].headers);
      setColumnMapping(suggested);
      setCurrentStep('MAP_COLUMNS');
    } catch (err: any) {
      alert(`Error reading file: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Switch sheet
  const handleSheetChange = (index: number) => {
    setSelectedSheetIndex(index);
    const suggested = autoSuggestColumnMapping(sheets[index].headers);
    setColumnMapping(suggested);
  };

  // Apply saved template
  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = savedTemplates.find((t) => t.id === templateId);
    if (template) {
      setColumnMapping(template.fieldMapping);
    }
  };

  // Save mapping template
  const handleSaveCurrentMapping = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name.');
      return;
    }
    const newTemplate: ColumnMappingConfig = {
      id: `tmpl_${Date.now()}`,
      workspaceId: workspace.id,
      name: templateName.trim(),
      sourceSystem: 'custom_excel',
      fieldMapping: columnMapping,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSaveTemplate(newTemplate);
    alert(`Template "${templateName}" saved successfully.`);
    setTemplateName('');
  };

  // Run normalization & validation
  const handleRunNormalization = () => {
    if (!currentSheet) return;

    setIsProcessing(true);
    try {
      const { invoices, errors } = normalizeRawRowsToInvoices(
        currentSheet.rows,
        columnMapping,
        workspace
      );

      // Run full rule validation engine
      const { validatedInvoices } = validationEngine.validateBatch(invoices);

      setNormalizedInvoices(validatedInvoices);
      setCurrentStep('PREVIEW_VALIDATE');
    } catch (err: any) {
      alert(`Transformation Error: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download standard template
  const handleDownloadStandardTemplate = () => {
    const data = generateStandardFBRExcelTemplate();
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Standard_Pakistan_FBR_Invoice_Template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download error report
  const handleDownloadErrorReport = () => {
    const errorInvoices = normalizedInvoices.filter((inv) => inv.validationErrors.length > 0);
    if (errorInvoices.length === 0) {
      alert('No validation errors found in the current dataset.');
      return;
    }
    const data = generateErrorReportExcel(errorInvoices);
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FBR_Validation_Errors_${fileName || 'batch'}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Commit valid invoices to repository
  const handleCommitInvoices = () => {
    const blockingInvoices = normalizedInvoices.filter((inv) =>
      inv.validationErrors.some((e) => e.severity === 'ERROR')
    );

    if (blockingInvoices.length > 0) {
      const proceed = window.confirm(
        `Warning: ${blockingInvoices.length} invoice(s) have blocking ERROR conditions and will be imported as DRAFT. Only valid invoices can be submitted to FBR.\n\nProceed with import?`
      );
      if (!proceed) return;
    }

    onImportComplete(normalizedInvoices);
  };

  // Inline correction save
  const handleSaveInlineEdit = (updatedInv: NormalizedInvoice) => {
    const revalidated = validationEngine.validateInvoice(updatedInv, normalizedInvoices);
    const hasBlocking = revalidated.some((e) => e.severity === 'ERROR');

    const fixedInvoice: NormalizedInvoice = {
      ...updatedInv,
      validationErrors: revalidated,
      validationStatus: hasBlocking ? 'invalid' : 'valid',
      status: hasBlocking ? 'DRAFT' : 'VALIDATED',
      updatedAt: new Date().toISOString(),
    };

    setNormalizedInvoices((prev) =>
      prev.map((inv) => (inv.id === fixedInvoice.id ? fixedInvoice : inv))
    );
    setEditingInvoice(null);
  };

  const totalErrors = normalizedInvoices.reduce(
    (sum, inv) => sum + inv.validationErrors.filter((e) => e.severity === 'ERROR').length,
    0
  );
  const totalWarnings = normalizedInvoices.reduce(
    (sum, inv) => sum + inv.validationErrors.filter((e) => e.severity === 'WARNING').length,
    0
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Wizard Progress Stepper - White & Amber Gold */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 text-xs font-bold ${
            currentStep === 'UPLOAD' ? 'text-amber-800' : 'text-stone-500'
          }`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              currentStep === 'UPLOAD' ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600'
            }`}>1</span>
            <span>Upload File</span>
          </div>

          <div className="text-stone-300">/</div>

          <div className={`flex items-center gap-2 text-xs font-bold ${
            currentStep === 'MAP_COLUMNS' ? 'text-amber-800' : 'text-stone-500'
          }`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              currentStep === 'MAP_COLUMNS' ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600'
            }`}>2</span>
            <span>Field Mapping</span>
          </div>

          <div className="text-stone-300">/</div>

          <div className={`flex items-center gap-2 text-xs font-bold ${
            currentStep === 'PREVIEW_VALIDATE' ? 'text-amber-800' : 'text-stone-500'
          }`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              currentStep === 'PREVIEW_VALIDATE' ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600'
            }`}>3</span>
            <span>Validation & Resolution</span>
          </div>
        </div>

        <button
          onClick={handleDownloadStandardTemplate}
          className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-300 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-amber-600" />
          <span>Download Standard FBR Template (.xlsx)</span>
        </button>
      </div>

      {/* STEP 1: UPLOAD */}
      {currentStep === 'UPLOAD' && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-3xl p-12 text-center transition-all group shadow-xs">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 group-hover:border-amber-400 flex items-center justify-center text-amber-600 mx-auto transition-colors shadow-xs">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mt-4">
              Upload Excel (.xlsx, .xls) or CSV Invoice Data
            </h3>
            <p className="text-xs text-stone-600 mt-1 max-w-md mx-auto leading-relaxed">
              Drag and drop your spreadsheet or click below. Supports multiple line items per invoice, 
              custom column layouts, and pre-saved mapping templates.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{isProcessing ? 'Processing File...' : 'Select File from Computer'}</span>
              </button>
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">
              FBR Invoicing Ingestion Invariants
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-stone-600">
              <div className="space-y-1 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-900">No Silent Alterations</span>
                <p>The system never silently modifies invoice amounts, dates, or NTN values. Errors must be explicitly resolved.</p>
              </div>
              <div className="space-y-1 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-900">Multi-Item Invoices</span>
                <p>Rows sharing the same Invoice Number are automatically grouped into a single unified multi-line tax invoice.</p>
              </div>
              <div className="space-y-1 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-900">Tax Arithmetic</span>
                <p>Automatic verification of 18% standard sales tax, 3% further tax, and line vs grand total reconciliation.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: MAP COLUMNS */}
      {currentStep === 'MAP_COLUMNS' && currentSheet && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-stone-900">{fileName}</div>
                <div className="text-[11px] text-stone-600 font-medium">
                  Worksheet: <span className="font-bold text-stone-900">{currentSheet.sheetName}</span> · {currentSheet.totalRows} data rows detected
                </div>
              </div>
            </div>

            {/* Sheet Selector if multiple sheets */}
            {sheets.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-600 font-semibold">Select Sheet:</span>
                <select
                  value={selectedSheetIndex}
                  onChange={(e) => handleSheetChange(Number(e.target.value))}
                  className="bg-stone-50 border border-stone-300 text-xs text-stone-900 rounded-xl px-3 py-1.5 focus:border-amber-500 font-medium"
                >
                  {sheets.map((s, idx) => (
                    <option key={s.sheetName} value={idx}>{s.sheetName} ({s.totalRows} rows)</option>
                  ))}
                </select>
              </div>
            )}

            {/* Load Saved Template */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-600 font-semibold">Load Template:</span>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleApplyTemplate(e.target.value)}
                className="bg-stone-50 border border-stone-300 text-xs text-stone-900 rounded-xl px-3 py-1.5 focus:border-amber-500 font-medium"
              >
                <option value="">-- Custom / Auto Detected --</option>
                {savedTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mapping Grid */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Column Field Mapping</h3>
                <p className="text-xs text-stone-600">Map your spreadsheet headers to internal canonical compliance fields</p>
              </div>

              {/* Save template inline */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Template Name (e.g. ERP Monthly)"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="bg-white border border-stone-300 text-xs text-stone-900 rounded-xl px-3 py-1.5 w-52 focus:border-amber-500 placeholder-stone-400 font-medium"
                />
                <button
                  onClick={handleSaveCurrentMapping}
                  className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-amber-700" />
                  <span>Save Template</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold">
                    <th className="p-3.5 w-1/4">Canonical Compliance Field</th>
                    <th className="p-3.5 w-1/4">Category & Rule</th>
                    <th className="p-3.5 w-1/3">Source Excel Column Header</th>
                    <th className="p-3.5">Sample First Row Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-900 font-sans text-xs">
                  {CANONICAL_MAPPING_FIELDS.map((fieldDef) => {
                    const mappedHeader = columnMapping[fieldDef.targetField] || '';
                    const sampleVal = mappedHeader && currentSheet.rows[0] ? currentSheet.rows[0][mappedHeader] : '-';

                    return (
                      <tr key={fieldDef.targetField} className="hover:bg-stone-50">
                        <td className="p-3.5">
                          <div className="font-bold text-stone-900 flex items-center gap-1.5">
                            <span>{fieldDef.label}</span>
                            {fieldDef.required && (
                              <span className="text-rose-600 font-bold">*</span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-stone-500 mt-0.5">{fieldDef.targetField}</div>
                        </td>

                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                            {fieldDef.category}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <select
                            value={mappedHeader}
                            onChange={(e) =>
                              setColumnMapping({
                                ...columnMapping,
                                [fieldDef.targetField]: e.target.value,
                              })
                            }
                            className="w-full bg-stone-50 border border-stone-300 text-stone-900 rounded-xl p-2 text-xs focus:border-amber-500 font-medium"
                          >
                            <option value="">-- Unmapped --</option>
                            {currentSheet.headers.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </td>

                        <td className="p-3.5 font-mono text-stone-700 truncate max-w-xs">
                          {String(sampleVal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep('UPLOAD')}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Back to Upload
              </button>

              <button
                onClick={handleRunNormalization}
                disabled={isProcessing}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Normalize & Validate Data</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW & VALIDATE */}
      {currentStep === 'PREVIEW_VALIDATE' && (
        <div className="space-y-6">
          {/* Validation Header Summary */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-stone-900">Validation & Reconciliation Summary</h3>
              <p className="text-xs text-stone-600 font-medium">
                {normalizedInvoices.length} compliant invoices parsed from spreadsheet. Review errors before final ingestion.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {totalErrors > 0 && (
                <button
                  onClick={handleDownloadErrorReport}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs font-bold rounded-xl border border-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-rose-700" />
                  <span>Export Error Report ({totalErrors})</span>
                </button>
              )}

              <button
                onClick={handleCommitInvoices}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Import {normalizedInvoices.length} Invoices</span>
              </button>
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold">
                    <th className="p-3.5">Invoice No</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Buyer Name</th>
                    <th className="p-3.5">Buyer NTN/CNIC</th>
                    <th className="p-3.5 text-right">Items</th>
                    <th className="p-3.5 text-right">Taxable (PKR)</th>
                    <th className="p-3.5 text-right">Sales Tax</th>
                    <th className="p-3.5 text-right">Grand Total</th>
                    <th className="p-3.5 text-center">Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-900 font-sans text-xs">
                  {normalizedInvoices.map((inv) => {
                    const blocking = inv.validationErrors.filter((e) => e.severity === 'ERROR');
                    return (
                      <tr key={inv.id} className="hover:bg-stone-50">
                        <td className="p-3.5 font-bold font-mono text-stone-900">{inv.invoiceNumber}</td>
                        <td className="p-3.5 text-stone-600">{inv.invoiceDate}</td>
                        <td className="p-3.5 font-semibold text-stone-900">{inv.buyer.name}</td>
                        <td className="p-3.5 font-mono text-stone-600">{inv.buyer.ntn || inv.buyer.cnic || 'Unregistered'}</td>
                        <td className="p-3.5 text-right font-mono">{inv.items.length}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-stone-900">
                          {inv.summary.totalTaxableValue.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-amber-800">
                          {inv.summary.totalSalesTax.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-stone-950">
                          {inv.summary.grandTotal.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-center">
                          {blocking.length > 0 ? (
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                              {blocking.length} Error(s)
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              Valid
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
