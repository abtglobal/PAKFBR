import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { Workspace } from '../types/fbr';

export interface CustomerRecord {
  id: string;
  name: string;
  ntn?: string;
  cnic?: string;
  strn?: string;
  type: 'registered_business' | 'unregistered_business' | 'end_consumer' | 'exporter';
  atlStatus: 'ACTIVE' | 'INACTIVE' | 'UNREGISTERED';
  address: string;
  city: string;
  province: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

export function CustomersView({ workspace }: { workspace: Workspace }) {
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      localStorage.removeItem('paktax_customers_v1');
      localStorage.removeItem('paktax_customers_v2');
      localStorage.removeItem(`paktax_customers_v2_${workspace.id}`);
      const saved = localStorage.getItem(`paktax_customers_v3_${workspace.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCust, setNewCust] = useState<Partial<CustomerRecord>>({
    type: 'registered_business',
    atlStatus: 'ACTIVE',
    city: '',
    province: '',
  });

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.ntn && c.ntn.includes(searchTerm)) ||
      (c.cnic && c.cnic.includes(searchTerm)) ||
      (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name) return;

    const customer: CustomerRecord = {
      id: `cust_${Date.now()}`,
      name: newCust.name,
      ntn: newCust.ntn,
      cnic: newCust.cnic,
      strn: newCust.strn,
      type: newCust.type || 'registered_business',
      atlStatus: newCust.atlStatus || 'ACTIVE',
      address: newCust.address || '',
      city: newCust.city || '',
      province: newCust.province || '',
      contactPerson: newCust.contactPerson,
      phone: newCust.phone,
      email: newCust.email,
    };

    const updated = [customer, ...customers];
    setCustomers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`paktax_customers_v3_${workspace.id}`, JSON.stringify(updated));
    }
    setIsModalOpen(false);
    setNewCust({ type: 'registered_business', atlStatus: 'ACTIVE', city: '', province: '' });
  };

  const handleDeleteCustomer = (id: string) => {
    if (window.confirm('Delete this customer from the registry?')) {
      const updated = customers.filter((c) => c.id !== id);
      setCustomers(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`paktax_customers_v3_${workspace.id}`, JSON.stringify(updated));
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Customer & Buyer Registry</h2>
            <p className="text-xs text-stone-600 font-medium">Master registry of buyers, ATL status verification, and NTN records</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, NTN, CNIC, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-500 shadow-xs">
            <Users className="w-10 h-10 mx-auto mb-3 text-stone-300" />
            <div className="text-base font-bold text-stone-800">No Customers Registered</div>
            <div className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Add your first buyer or client to auto-populate invoices with validated NTNs and CNICs.
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Add First Customer
            </button>
          </div>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs hover:border-amber-300 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">{c.name}</h3>
                  <div className="text-[11px] text-stone-500 capitalize">{c.type.replace('_', ' ')}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  c.atlStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                  c.atlStatus === 'INACTIVE' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                  'bg-stone-100 text-stone-700 border border-stone-200'
                }`}>
                  ATL: {c.atlStatus}
                </span>
              </div>

              <div className="space-y-1 text-xs text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200 font-mono">
                <div>NTN: <span className="font-bold text-stone-900">{c.ntn || 'N/A'}</span></div>
                <div>CNIC: <span className="font-bold text-stone-900">{c.cnic || 'N/A'}</span></div>
                {c.strn && <div>STRN: <span className="font-bold text-stone-900">{c.strn}</span></div>}
              </div>

              {c.address && (
                <div className="text-xs text-stone-600 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                  <span>{c.address}{c.city ? `, ${c.city}` : ''}</span>
                </div>
              )}

              <div className="pt-2 border-t border-stone-100 flex justify-end">
                <button
                  onClick={() => handleDeleteCustomer(c.id)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete Customer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-bold text-stone-900">Add New Buyer / Customer</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-stone-700 font-bold block mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  value={newCust.name || ''}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. Registered Customer Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Buyer NTN</label>
                  <input
                    type="text"
                    value={newCust.ntn || ''}
                    onChange={(e) => setNewCust({ ...newCust, ntn: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 font-mono focus:border-amber-500 focus:outline-none"
                    placeholder="1234567-8"
                  />
                </div>
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Buyer CNIC</label>
                  <input
                    type="text"
                    value={newCust.cnic || ''}
                    onChange={(e) => setNewCust({ ...newCust, cnic: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 font-mono focus:border-amber-500 focus:outline-none"
                    placeholder="4210112345671"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-700 font-bold block mb-1">City</label>
                  <input
                    type="text"
                    value={newCust.city || ''}
                    onChange={(e) => setNewCust({ ...newCust, city: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:border-amber-500 focus:outline-none"
                    placeholder="Karachi, Lahore, etc."
                  />
                </div>
                <div>
                  <label className="text-stone-700 font-bold block mb-1">ATL Status</label>
                  <select
                    value={newCust.atlStatus || 'ACTIVE'}
                    onChange={(e) => setNewCust({ ...newCust, atlStatus: e.target.value as any })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:border-amber-500 focus:outline-none font-medium"
                  >
                    <option value="ACTIVE">Active (FBR ATL)</option>
                    <option value="INACTIVE">Inactive (Non-ATL)</option>
                    <option value="UNREGISTERED">Unregistered</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-stone-700 font-bold block mb-1">Address</label>
                <input
                  type="text"
                  value={newCust.address || ''}
                  onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:border-amber-500 focus:outline-none"
                  placeholder="Street address"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
