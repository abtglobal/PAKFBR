import React, { useState } from 'react';
import {
  FolderSync,
  FileSpreadsheet,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Calendar,
  Layers,
  Database,
  Percent,
  Tag
} from 'lucide-react';
import { ColumnMappingConfig, Workspace, TaxRateConfig, HSCodeDefinition } from '../types/fbr';
import { generateStandardFBRExcelTemplate } from '../services/excelParser';

export function ExcelTemplatesView({
  templates,
  workspace,
  onDeleteTemplate,
  onSaveTemplate,
}: {
  templates: ColumnMappingConfig[];
  workspace: Workspace;
  onDeleteTemplate: (id: string) => void;
  onSaveTemplate: (template: ColumnMappingConfig) => void;
}) {
  const handleDownloadTemplate = () => {
    const data = generateStandardFBRExcelTemplate();
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PakTax_FBR_Excel_Standard_Template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-stone-900">Excel & ERP Column Mapping Profiles</h2>
          <p className="text-xs text-stone-600 font-medium mt-0.5">
            Saved reusable column mapping definitions for SAP, Oracle, Odoo, IFS, and internal spreadsheets.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Standard FBR Template (.xlsx)</span>
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-500 shadow-xs">
          <FolderSync className="w-10 h-10 mx-auto text-stone-300 mb-3" />
          <div className="text-base font-bold text-stone-800">No Custom Profiles Saved</div>
          <div className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            When you import an Excel spreadsheet, you can save your custom header mappings as a reusable profile.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tmpl) => (
            <div key={tmpl.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs hover:border-amber-300 transition-all space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">{tmpl.name}</h3>
                  <div className="text-[11px] text-stone-500 font-medium">Source: {tmpl.sourceSystem}</div>
                </div>
                <button
                  onClick={() => onDeleteTemplate(tmpl.id)}
                  className="p-1 text-stone-400 hover:text-rose-600 rounded cursor-pointer"
                  title="Delete Template"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs font-mono text-stone-700 space-y-1 max-h-36 overflow-y-auto">
                {Object.entries(tmpl.fieldMapping).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-stone-500 truncate mr-2">{k}:</span>
                    <span className="font-bold text-stone-900">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TaxConfigurationView({
  taxRates,
  hsCodes,
  workspace,
}: {
  taxRates: TaxRateConfig[];
  hsCodes: HSCodeDefinition[];
  workspace: Workspace;
}) {
  const [activeTab, setActiveTab] = useState<'RATES' | 'HS_CODES'>('RATES');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-stone-900">Pakistan Sales Tax Schedules & Customs Tariff</h2>
          <p className="text-xs text-stone-600 font-medium mt-0.5">
            Statutory tax schedules under Sales Tax Act 1990 and Pakistan Customs Tariff (PCT) codes.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('RATES')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'RATES' ? 'bg-amber-500 text-white shadow-xs' : 'text-stone-700 hover:text-stone-950'
            }`}
          >
            Sales Tax Schedules
          </button>
          <button
            onClick={() => setActiveTab('HS_CODES')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'HS_CODES' ? 'bg-amber-500 text-white shadow-xs' : 'text-stone-700 hover:text-stone-950'
            }`}
          >
            HS Tariff Reference ({hsCodes.length})
          </button>
        </div>
      </div>

      {activeTab === 'RATES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {taxRates.map((rate) => (
            <div key={rate.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">{rate.name}</h3>
                  <div className="text-[11px] text-stone-500 font-semibold">{rate.schedule}</div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-mono font-bold text-sm">
                  {rate.rate}%
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">{rate.description}</p>
              <div className="text-[10px] text-stone-500 font-mono pt-2 border-t border-stone-100">
                Effective: {rate.effectiveDate}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'HS_CODES' && (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold">
                  <th className="p-3.5">HS Code (PCT)</th>
                  <th className="p-3.5">Commodity Description</th>
                  <th className="p-3.5">Statutory UOM</th>
                  <th className="p-3.5 text-right">Applicable ST Rate</th>
                  <th className="p-3.5">Schedule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-stone-900 font-sans text-xs">
                {hsCodes.map((item) => (
                  <tr key={item.code} className="hover:bg-stone-50">
                    <td className="p-3.5 font-mono font-bold text-stone-900">{item.code}</td>
                    <td className="p-3.5 font-semibold text-stone-900">{item.description}</td>
                    <td className="p-3.5 text-stone-600 font-mono">{item.uom}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-amber-800">{item.salesTaxRate}%</td>
                    <td className="p-3.5 text-stone-600">{item.schedule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
