import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  FileText,
  CheckSquare,
  Send,
  Receipt,
  Settings as SettingsIcon,
  ShieldCheck,
  History,
  FolderSync,
  Percent,
  BookOpen,
  Building2,
  ChevronDown,
  Users,
  Package,
  UserCheck,
  Sliders,
  Monitor
} from 'lucide-react';
import { Workspace } from '../types/fbr';

export type NavItem =
  | 'DASHBOARD'
  | 'INVOICES'
  | 'IMPORT'
  | 'TEMPLATES'
  | 'VALIDATION'
  | 'SUBMISSION'
  | 'RESPONSES'
  | 'CUSTOMERS'
  | 'PRODUCTS'
  | 'TAX_CONFIG'
  | 'INTEGRATION'
  | 'AUDIT_LOG'
  | 'SETTINGS'
  | 'USERS_ROLES'
  | 'DOCUMENTATION'
  | 'DESKTOP_EXE';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  workspace: Workspace;
  workspaces: Workspace[];
  onSelectWorkspace: (id: string) => void;
  pendingCount: number;
  invalidCount: number;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  workspace,
  workspaces,
  onSelectWorkspace,
  pendingCount,
  invalidCount,
}: SidebarProps) {
  const [showWorkspaceMenu, setShowWorkspaceMenu] = React.useState(false);

  const pipelineLinks: Array<{ id: NavItem; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }> = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'INVOICES', label: 'Invoices & PDF', icon: <FileText className="w-4 h-4" /> },
    { id: 'IMPORT', label: 'Excel / CSV Import', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'TEMPLATES', label: 'Excel Templates', icon: <FolderSync className="w-4 h-4" /> },
    { 
      id: 'VALIDATION', 
      label: 'Validation Engine', 
      icon: <CheckSquare className="w-4 h-4" />,
      badge: invalidCount > 0 ? invalidCount : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
    },
    { 
      id: 'SUBMISSION', 
      label: 'FBR Submission', 
      icon: <Send className="w-4 h-4" />,
      badge: pendingCount > 0 ? pendingCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
    },
    { id: 'RESPONSES', label: 'FBR Responses & IRN', icon: <Receipt className="w-4 h-4" /> },
  ];

  const registryLinks: Array<{ id: NavItem; label: string; icon: React.ReactNode }> = [
    { id: 'CUSTOMERS', label: 'Customers', icon: <Users className="w-4 h-4" /> },
    { id: 'PRODUCTS', label: 'Products & HS Codes', icon: <Package className="w-4 h-4" /> },
    { id: 'TAX_CONFIG', label: 'Tax Configuration', icon: <Percent className="w-4 h-4" /> },
  ];

  const systemLinks: Array<{ id: NavItem; label: string; icon: React.ReactNode }> = [
    { id: 'DESKTOP_EXE', label: 'Desktop App & Offline', icon: <Monitor className="w-4 h-4 text-emerald-700" /> },
    { id: 'INTEGRATION', label: 'Integration Adapter', icon: <SettingsIcon className="w-4 h-4" /> },
    { id: 'AUDIT_LOG', label: 'Audit Log', icon: <History className="w-4 h-4" /> },
    { id: 'SETTINGS', label: 'Settings', icon: <Sliders className="w-4 h-4" /> },
    { id: 'USERS_ROLES', label: 'Users & Roles', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'DOCUMENTATION', label: 'Compliance Architecture', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-white border-r border-stone-200 flex flex-col shrink-0 min-h-screen select-none shadow-xs">
      {/* Brand Header */}
      <div className="p-4 border-b border-stone-200 bg-gradient-to-b from-amber-50/40 to-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold shadow-md shadow-amber-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-stone-900 flex items-center gap-1.5">
              <span>PakTax FBR</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded">
                COMPLIANCE
              </span>
            </div>
            <div className="text-[11px] text-stone-600 font-medium">Digital Invoicing Gateway</div>
          </div>
        </div>
      </div>

      {/* Multi-Company / Workspace Switcher */}
      <div className="p-3 border-b border-stone-200 relative bg-stone-50/50">
        <div className="text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1.5 px-1 flex items-center justify-between">
          <span>Active Taxpayer Entity</span>
          <span className="text-amber-700 font-mono font-bold text-[9px] bg-amber-100 px-1 py-0.2 rounded border border-amber-200">
            {workspace.userRole}
          </span>
        </div>
        <button
          onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
          className="w-full text-left p-2.5 rounded-xl bg-white border border-stone-300 hover:border-amber-400 hover:shadow-xs transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="truncate">
              <div className="text-xs font-bold text-stone-900 truncate">
                {workspace.profile.businessName || 'Taxpayer Entity (Unconfigured)'}
              </div>
              <div className="text-[11px] font-mono text-stone-600 font-medium">NTN: {workspace.profile.ntn || 'Unconfigured'}</div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-stone-500 group-hover:text-stone-900 shrink-0 ml-1" />
        </button>

        {showWorkspaceMenu && (
          <div className="absolute top-full left-3 right-3 mt-1 bg-white border border-stone-300 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-stone-200">
            <div className="p-2.5 text-[11px] text-stone-700 font-bold bg-amber-50/60">
              Taxpayer Workspace
            </div>
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  onSelectWorkspace(ws.id);
                  setShowWorkspaceMenu(false);
                }}
                className={`w-full text-left p-2.5 text-xs hover:bg-amber-50/60 transition-colors flex items-start justify-between cursor-pointer ${
                  ws.id === workspace.id ? 'bg-amber-100/50 text-amber-900 font-bold' : 'text-stone-800'
                }`}
              >
                <div>
                  <div className="font-bold text-stone-900">{ws.profile.businessName || ws.profile.name || 'Taxpayer Entity'}</div>
                  <div className="text-[10px] font-mono text-stone-600">
                    NTN: {ws.profile.ntn || 'Unconfigured'}{ws.profile.city ? ` · ${ws.profile.city}` : ''}
                  </div>
                </div>
                {ws.id === workspace.id && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1"></span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        <div>
          <div className="text-[10px] font-bold text-stone-600 uppercase tracking-wider px-2 mb-1.5">
            Compliance Pipeline
          </div>
          <div className="space-y-1">
            {pipelineLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onSelectTab(link.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {link.icon}
                    <span>{link.label}</span>
                  </div>
                  {link.badge !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                      isActive ? 'bg-white/20 text-white border border-white/30' : link.badgeColor
                    }`}>
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold text-stone-600 uppercase tracking-wider px-2 mb-1.5">
            Master Registers
          </div>
          <div className="space-y-1">
            {registryLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onSelectTab(link.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {link.icon}
                    <span>{link.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold text-stone-600 uppercase tracking-wider px-2 mb-1.5">
            System & Desktop
          </div>
          <div className="space-y-1">
            {systemLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onSelectTab(link.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {link.icon}
                    <span>{link.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Taxpayer Status Card */}
      <div className="p-3 border-t border-stone-200 bg-stone-50">
        <div className="p-2.5 rounded-xl bg-white border border-stone-200 text-xs shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-stone-700">Environment</span>
            <span className="font-mono text-[10px] font-bold text-amber-800 px-1.5 py-0.5 bg-amber-100 border border-amber-300 rounded">
              {workspace.fbrConfig.environment}
            </span>
          </div>
          <div className="text-[11px] text-stone-600 truncate font-medium">
            POS: <span className="font-mono font-bold text-stone-900">{workspace.fbrConfig.posId || 'Not Set'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

interface HeaderProps {
  currentTab: NavItem;
  workspace: Workspace;
  onNewInvoice: () => void;
  onImportExcel: () => void;
  onOpenDesktop: () => void;
}

export function Header({ currentTab, workspace, onNewInvoice, onImportExcel, onOpenDesktop }: HeaderProps) {
  const titles: Record<NavItem, { title: string; subtitle: string }> = {
    DASHBOARD: { title: 'Compliance Dashboard', subtitle: 'Real-time overview of invoices, validation status, and FBR submissions' },
    INVOICES: { title: 'Tax Invoices Master & PDF', subtitle: 'Manage, search, validate, and download statutory PDF invoices' },
    IMPORT: { title: 'Excel & CSV Ingestion Engine', subtitle: 'Import, map columns, validate arithmetic, and resolve errors' },
    TEMPLATES: { title: 'Mapping Templates Catalog', subtitle: 'Pre-configured mapping profiles for SAP, Odoo, Oracle, and FBR Excel formats' },
    VALIDATION: { title: 'Validation Rule Engine', subtitle: 'Multi-tier structural, tax calculation, and FBR tariff rule controls' },
    SUBMISSION: { title: 'FBR Submission Workbench', subtitle: 'Batch transmission to FBR Digital Invoicing PRAL Gateway' },
    RESPONSES: { title: 'FBR Acknowledgements & IRN Registry', subtitle: 'Official FBR invoice numbers, IRNs, QR codes, and response logs' },
    CUSTOMERS: { title: 'Customer & Buyer Registry', subtitle: 'Master registry of registered and unregistered buyers, NTN/CNIC, and ATL statuses' },
    PRODUCTS: { title: 'Products & Customs Tariff Catalog', subtitle: 'Commodities catalog with standard HS codes, UOMs, and sales tax schedules' },
    TAX_CONFIG: { title: 'Tax Rates Configuration', subtitle: 'Pakistan Sales Tax Act schedules (18% ST, 3% Further Tax, 5th, 6th, 8th Schedules)' },
    INTEGRATION: { title: 'Submission Adapter & Security Settings', subtitle: 'FBR endpoint configuration, digital certificates, and auth credentials' },
    AUDIT_LOG: { title: 'Immutable Compliance Audit Trail', subtitle: 'Complete chronological history of data transformations and filings' },
    SETTINGS: { title: 'Taxpayer Profile & System Settings', subtitle: 'Registered entity parameters, sector, and provincial tax jurisdiction' },
    USERS_ROLES: { title: 'Users & Role-Based Access Control', subtitle: 'Admin, Tax Consultant, Chief Accountant, and Auditor privilege management' },
    DOCUMENTATION: { title: 'System Architecture & FBR Reference', subtitle: 'Technical specification matrix, database schemas, and compliance boundary' },
    DESKTOP_EXE: { title: 'Desktop Executable (.exe) & Compilation', subtitle: 'Windows desktop packaging, 1-click batch builders, and offline setup' },
  };

  const info = titles[currentTab] || { title: 'Compliance Platform', subtitle: '' };

  return (
    <header className="h-16 bg-white border-b border-stone-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
      <div>
        <h1 className="text-base font-bold text-stone-900 tracking-tight">{info.title}</h1>
        <p className="text-xs text-stone-600 hidden sm:block font-medium">{info.subtitle}</p>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenDesktop}
          className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          title="Install or run as standalone desktop application"
        >
          <Monitor className="w-3.5 h-3.5 text-emerald-700" />
          <span>Desktop App</span>
        </button>
        <button
          onClick={onImportExcel}
          className="px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold rounded-xl border border-stone-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
          <span>Upload Excel</span>
        </button>
        <button
          onClick={onNewInvoice}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span>+ Create Invoice</span>
        </button>
      </div>
    </header>
  );
}
