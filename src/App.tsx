/**
 * Pakistan FBR Digital Invoicing Compliance Platform
 * Main Application Shell
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, Header, NavItem } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { InvoicesListView } from './components/InvoicesListView';
import { InvoiceDetailView } from './components/InvoiceDetailView';
import { ExcelImportView } from './components/ExcelImportView';
import { ValidationEngineView } from './components/ValidationEngineView';
import { SubmissionQueueView, FBRResponsesView } from './components/SubmissionQueueView';
import { ExcelTemplatesView, TaxConfigurationView } from './components/TaxConfigurationView';
import { IntegrationConfigView, AuditLogView } from './components/IntegrationConfigView';
import { CustomersView } from './components/CustomersView';
import { ProductsView } from './components/ProductsView';
import { UsersRolesView } from './components/UsersRolesView';
import { SettingsView } from './components/SettingsView';
import { DocumentationView } from './components/DocumentationView';
import { DesktopExecutableView } from './components/DesktopExecutableView';
import { ManualInvoiceModal } from './components/ManualInvoiceModal';
import { storageService } from './services/storageService';
import { NormalizedInvoice, Workspace, ColumnMappingConfig } from './types/fbr';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavItem>('DASHBOARD');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [invoices, setInvoices] = useState<NormalizedInvoice[]>([]);
  const [templates, setTemplates] = useState<ColumnMappingConfig[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Load state on mount and when workspace changes
  useEffect(() => {
    const allWs = storageService.getWorkspaces();
    const activeWs = storageService.getActiveWorkspace();
    setWorkspaces(allWs);
    setActiveWorkspace(activeWs);

    if (activeWs) {
      setInvoices(storageService.getInvoices(activeWs.id));
      setTemplates(storageService.getMappingTemplates(activeWs.id));
    }
  }, []);

  const handleSelectWorkspace = (workspaceId: string) => {
    storageService.setActiveWorkspace(workspaceId);
    const activeWs = storageService.getActiveWorkspace();
    setActiveWorkspace(activeWs);
    setInvoices(storageService.getInvoices(workspaceId));
    setTemplates(storageService.getMappingTemplates(workspaceId));
    setSelectedInvoiceId(null);
  };

  const handleUpdateInvoices = (updatedInvoices: NormalizedInvoice[]) => {
    setInvoices(updatedInvoices);
    storageService.saveInvoicesBatch(updatedInvoices);
  };

  const handleSaveInvoice = (invoice: NormalizedInvoice) => {
    storageService.saveInvoice(invoice);
    if (activeWorkspace) {
      setInvoices(storageService.getInvoices(activeWorkspace.id));
    }
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice record?')) {
      storageService.deleteInvoice(id);
      if (activeWorkspace) {
        setInvoices(storageService.getInvoices(activeWorkspace.id));
      }
      if (selectedInvoiceId === id) {
        setSelectedInvoiceId(null);
      }
    }
  };

  const handleSaveTemplate = (template: ColumnMappingConfig) => {
    storageService.saveMappingTemplate(template);
    if (activeWorkspace) {
      setTemplates(storageService.getMappingTemplates(activeWorkspace.id));
    }
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Delete this mapping template?')) {
      storageService.deleteMappingTemplate(id);
      if (activeWorkspace) {
        setTemplates(storageService.getMappingTemplates(activeWorkspace.id));
      }
    }
  };

  const handleUpdateWorkspace = (ws: Workspace) => {
    storageService.updateWorkspace(ws);
    setActiveWorkspace(ws);
    setWorkspaces(storageService.getWorkspaces());
  };

  const handleImportComplete = (importedInvoices: NormalizedInvoice[]) => {
    storageService.saveInvoicesBatch(importedInvoices);
    if (activeWorkspace) {
      setInvoices(storageService.getInvoices(activeWorkspace.id));
    }
    setCurrentTab('INVOICES');
    alert(`Successfully imported and normalized ${importedInvoices.length} invoices.`);
  };

  if (!activeWorkspace) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center text-stone-600 font-mono text-xs">
        Initializing compliance workspace...
      </div>
    );
  }

  const selectedInvoice = selectedInvoiceId
    ? invoices.find((inv) => inv.id === selectedInvoiceId)
    : null;

  const pendingCount = invoices.filter(
    (i) => i.status === 'VALIDATED' || i.status === 'READY'
  ).length;
  const invalidCount = invoices.filter((i) => i.validationStatus === 'invalid').length;
  const auditLogs = storageService.getAuditLogs(activeWorkspace.id);

  return (
    <div className="min-h-screen flex bg-[#fafaf9] text-stone-900 selection:bg-amber-200 selection:text-amber-900">
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedInvoiceId(null);
          setCurrentTab(tab);
        }}
        workspace={activeWorkspace}
        workspaces={workspaces}
        onSelectWorkspace={handleSelectWorkspace}
        pendingCount={pendingCount}
        invalidCount={invalidCount}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentTab={currentTab}
          workspace={activeWorkspace}
          onNewInvoice={() => setIsManualModalOpen(true)}
          onImportExcel={() => {
            setSelectedInvoiceId(null);
            setCurrentTab('IMPORT');
          }}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          {selectedInvoice ? (
            <InvoiceDetailView
              invoice={selectedInvoice}
              workspace={activeWorkspace}
              onBack={() => setSelectedInvoiceId(null)}
              onUpdateInvoice={handleSaveInvoice}
            />
          ) : (
            <>
              {currentTab === 'DASHBOARD' && (
                <DashboardView
                  invoices={invoices}
                  workspace={activeWorkspace}
                  auditLogs={auditLogs}
                  onNavigate={(tab) => setCurrentTab(tab)}
                  onSelectInvoice={(id) => setSelectedInvoiceId(id)}
                />
              )}

              {currentTab === 'INVOICES' && (
                <InvoicesListView
                  invoices={invoices}
                  workspace={activeWorkspace}
                  onSelectInvoice={(id) => setSelectedInvoiceId(id)}
                  onDeleteInvoice={handleDeleteInvoice}
                  onUpdateInvoices={handleUpdateInvoices}
                  onImportClick={() => setCurrentTab('IMPORT')}
                  onNewInvoiceClick={() => setIsManualModalOpen(true)}
                />
              )}

              {currentTab === 'IMPORT' && (
                <ExcelImportView
                  workspace={activeWorkspace}
                  savedTemplates={templates}
                  onSaveTemplate={handleSaveTemplate}
                  onImportComplete={handleImportComplete}
                  onViewInvoiceDetail={(id) => setSelectedInvoiceId(id)}
                />
              )}

              {currentTab === 'TEMPLATES' && (
                <ExcelTemplatesView
                  templates={templates}
                  workspace={activeWorkspace}
                  onDeleteTemplate={handleDeleteTemplate}
                  onSaveTemplate={handleSaveTemplate}
                />
              )}

              {currentTab === 'VALIDATION' && (
                <ValidationEngineView
                  invoices={invoices}
                  onUpdateInvoices={handleUpdateInvoices}
                />
              )}

              {currentTab === 'SUBMISSION' && (
                <SubmissionQueueView
                  invoices={invoices}
                  workspace={activeWorkspace}
                  onUpdateInvoices={handleUpdateInvoices}
                  onSelectInvoice={(id) => setSelectedInvoiceId(id)}
                />
              )}

              {currentTab === 'RESPONSES' && (
                <FBRResponsesView
                  invoices={invoices}
                  onSelectInvoice={(id) => setSelectedInvoiceId(id)}
                />
              )}

              {currentTab === 'CUSTOMERS' && (
                <CustomersView
                  workspace={activeWorkspace}
                />
              )}

              {currentTab === 'PRODUCTS' && (
                <ProductsView
                  workspace={activeWorkspace}
                />
              )}

              {currentTab === 'TAX_CONFIG' && (
                <TaxConfigurationView
                  taxRates={storageService.getTaxRates()}
                  hsCodes={storageService.getHSCodes()}
                  workspace={activeWorkspace}
                />
              )}

              {currentTab === 'INTEGRATION' && (
                <IntegrationConfigView
                  workspace={activeWorkspace}
                  onUpdateWorkspace={handleUpdateWorkspace}
                />
              )}

              {currentTab === 'AUDIT_LOG' && (
                <AuditLogView
                  auditLogs={auditLogs}
                  workspace={activeWorkspace}
                />
              )}

              {currentTab === 'SETTINGS' && (
                <SettingsView
                  workspace={activeWorkspace}
                  onUpdateWorkspace={handleUpdateWorkspace}
                  onOpenDesktopGuide={() => setCurrentTab('DESKTOP_EXE')}
                />
              )}

              {currentTab === 'USERS_ROLES' && (
                <UsersRolesView
                  workspace={activeWorkspace}
                />
              )}

              {currentTab === 'DOCUMENTATION' && <DocumentationView />}
              {currentTab === 'DESKTOP_EXE' && <DesktopExecutableView />}
            </>
          )}
        </main>
      </div>

      {/* Manual Invoice Creation Modal */}
      <ManualInvoiceModal
        workspace={activeWorkspace}
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSave={handleSaveInvoice}
      />
    </div>
  );
}
