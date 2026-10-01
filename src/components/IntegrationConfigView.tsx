import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Key,
  Globe,
  Save,
  CheckCircle2,
  RefreshCw,
  History,
  Lock,
  Clock
} from 'lucide-react';
import { Workspace, AuditEntry } from '../types/fbr';

export function IntegrationConfigView({
  workspace,
  onUpdateWorkspace,
}: {
  workspace: Workspace;
  onUpdateWorkspace: (ws: Workspace) => void;
}) {
  const [fbrConfig, setFbrConfig] = useState({ ...workspace.fbrConfig });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWorkspace({
      ...workspace,
      fbrConfig,
    });
    alert('FBR Gateway API & Adapter settings saved.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-1">
            <SettingsIcon className="w-4 h-4 text-amber-600" />
            <span>FBR PRAL DIGITAL INVOICING ADAPTER</span>
          </div>
          <h2 className="text-base font-bold text-stone-900">PRAL Gateway API Credentials & Endpoints</h2>
          <p className="text-xs text-stone-600 font-medium mt-0.5">
            Configure transmission endpoints, digital signatures, POS identifiers, and sandbox tokens.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save API Settings</span>
        </button>
      </div>

      {/* FBR Portal Registration Data Card */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" />
              <span>FBR Iris / PRAL Portal Registration Information</span>
            </h3>
            <p className="text-xs text-stone-700 font-medium mt-1">
              Provide these exact details when registering your POS / Digital Invoicing software on the FBR e-Portal:
            </p>
          </div>
          <span className="px-2.5 py-1 bg-amber-600 text-white font-bold text-[10px] rounded-lg">
            SRO 581(I)/2024 Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-white p-3.5 rounded-xl border border-amber-200/80">
            <div className="text-[11px] font-bold text-stone-500 uppercase">Software Name</div>
            <div className="text-xs font-bold font-mono text-stone-900 mt-0.5 select-all">PakTax FBR Compliance Gateway</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-amber-200/80">
            <div className="text-[11px] font-bold text-stone-500 uppercase">Software Version</div>
            <div className="text-xs font-bold font-mono text-stone-900 mt-0.5 select-all">v1.0.0</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-amber-200/80">
            <div className="text-[11px] font-bold text-stone-500 uppercase">Integration Type</div>
            <div className="text-xs font-bold font-mono text-stone-900 mt-0.5 select-all">REST API / Digital Invoicing Gateway</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-amber-200/80">
            <div className="text-[11px] font-bold text-stone-500 uppercase">Outbound IP / Origin IP</div>
            <div className="text-xs font-medium text-stone-800 mt-0.5">
              Enter your office's <strong>Public Static IP</strong> (e.g. from your ISP) or your server IP.
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs text-stone-900">
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-600" />
            <span>Endpoint & Gateway Configuration</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-stone-700 font-bold block mb-1">Target Environment</label>
              <select
                value={fbrConfig.environment}
                onChange={(e) => setFbrConfig({ ...fbrConfig, environment: e.target.value as any })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 focus:border-amber-500 focus:outline-none font-medium"
              >
                <option value="sandbox">Sandbox / Staging (PRAL Testbed)</option>
                <option value="production">Production (Official FBR Gateway)</option>
              </select>
            </div>

            <div>
              <label className="text-stone-700 font-bold block mb-1">POS Identifier (PosID)</label>
              <input
                type="text"
                value={fbrConfig.posId}
                onChange={(e) => setFbrConfig({ ...fbrConfig, posId: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 font-mono focus:border-amber-500 focus:outline-none"
                placeholder="POS-01"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-stone-700 font-bold block mb-1">Base API URL</label>
              <input
                type="text"
                value={fbrConfig.baseUrl}
                onChange={(e) => setFbrConfig({ ...fbrConfig, baseUrl: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-stone-700 font-bold block mb-1">FBR Bearer Authentication Token / Key</label>
              <input
                type="password"
                value={fbrConfig.bearerToken || ''}
                onChange={(e) => setFbrConfig({ ...fbrConfig, bearerToken: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 font-mono focus:border-amber-500 focus:outline-none"
                placeholder="••••••••••••••••••••••••••••••••"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export function AuditLogView({
  auditLogs,
  workspace,
}: {
  auditLogs: AuditEntry[];
  workspace: Workspace;
}) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
        <h2 className="text-base font-bold text-stone-900">Immutable Compliance Audit Trail</h2>
        <p className="text-xs text-stone-600 font-medium mt-0.5">
          Chronological event history of invoice creation, validations, submissions, and status changes.
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Event Action</th>
                <th className="p-3.5">Invoice No</th>
                <th className="p-3.5">Details</th>
                <th className="p-3.5">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-900 font-sans text-xs">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-stone-500 font-sans">
                    <History className="w-10 h-10 mx-auto mb-3 text-stone-300" />
                    <div className="text-base font-bold text-stone-800">No Events Logged Yet</div>
                    <div className="text-xs text-stone-500 mt-1">Audit trail entries will automatically appear as you perform actions.</div>
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50">
                    <td className="p-3.5 font-mono text-[11px] text-stone-600">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-mono font-bold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-stone-900">{log.invoiceNumber || '-'}</td>
                    <td className="p-3.5 text-stone-800 font-medium">{log.details}</td>
                    <td className="p-3.5 text-stone-600 font-semibold">{log.userName}</td>
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
