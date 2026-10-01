import React, { useState } from 'react';
import {
  Package,
  Search,
  Plus,
  Tag,
  Percent,
  Layers,
  Edit2,
  Trash2,
  X,
  HelpCircle
} from 'lucide-react';
import { Workspace } from '../types/fbr';

export interface ProductItem {
  id: string;
  sku: string;
  description: string;
  hsCode: string;
  uom: string;
  defaultUnitPrice: number;
  standardSalesTaxRate: number;
  taxSchedule: string;
}

export function ProductsView({ workspace }: { workspace: Workspace }) {
  const [products, setProducts] = useState<ProductItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      localStorage.removeItem('paktax_products_v1');
      localStorage.removeItem('paktax_products_v2');
      localStorage.removeItem(`paktax_products_v2_${workspace.id}`);
      const saved = localStorage.getItem(`paktax_products_v3_${workspace.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProd, setNewProd] = useState<Partial<ProductItem>>({
    uom: 'PCS',
    standardSalesTaxRate: 18,
    taxSchedule: '3rd Schedule / Standard',
  });

  const filtered = products.filter(
    (p) =>
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.hsCode.includes(searchTerm)
  );

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.description || !newProd.hsCode) return;

    const item: ProductItem = {
      id: `prod_${Date.now()}`,
      sku: newProd.sku || `SKU-${Date.now().toString().slice(-4)}`,
      description: newProd.description,
      hsCode: newProd.hsCode,
      uom: newProd.uom || 'PCS',
      defaultUnitPrice: Number(newProd.defaultUnitPrice) || 0,
      standardSalesTaxRate: Number(newProd.standardSalesTaxRate) || 18,
      taxSchedule: newProd.taxSchedule || '3rd Schedule / Standard',
    };

    const updated = [item, ...products];
    setProducts(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`paktax_products_v3_${workspace.id}`, JSON.stringify(updated));
    }
    setIsModalOpen(false);
    setNewProd({ uom: 'PCS', standardSalesTaxRate: 18, taxSchedule: '3rd Schedule / Standard' });
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Delete this product from catalog?')) {
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`paktax_products_v3_${workspace.id}`, JSON.stringify(updated));
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Products & Customs Tariff Catalog</h2>
            <p className="text-xs text-stone-600 font-medium">Commodity catalog with standard HS codes, UOMs, and sales tax rates</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product description, SKU, or HS code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Table of Products */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold">
                <th className="p-3.5">SKU / Code</th>
                <th className="p-3.5">Item Description</th>
                <th className="p-3.5">Customs HS Code</th>
                <th className="p-3.5">UOM</th>
                <th className="p-3.5 text-right">Default Rate (PKR)</th>
                <th className="p-3.5 text-right">ST Rate</th>
                <th className="p-3.5">Tax Schedule</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-900 font-sans text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-stone-500 font-sans">
                    <Package className="w-10 h-10 mx-auto mb-3 text-stone-300" />
                    <div className="text-base font-bold text-stone-800">No Products Configured</div>
                    <div className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                      Add items to your catalog to auto-fill HS codes, descriptions, and statutory tax rates on invoices.
                    </div>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      Add First Product
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50">
                    <td className="p-3.5 font-bold font-mono text-stone-900">{p.sku}</td>
                    <td className="p-3.5 font-semibold text-stone-900">{p.description}</td>
                    <td className="p-3.5 font-mono text-stone-700">{p.hsCode}</td>
                    <td className="p-3.5 text-stone-600">{p.uom}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-stone-900 tabular-nums">
                      {p.defaultUnitPrice.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-amber-800">{p.standardSalesTaxRate}%</td>
                    <td className="p-3.5 text-stone-600">{p.taxSchedule}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-bold text-stone-900">Add Product & HS Code</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="text-stone-700 font-bold block mb-1">Item Description *</label>
                <input
                  type="text"
                  required
                  value={newProd.description || ''}
                  onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. Cotton Fabrics Woven"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-700 font-bold block mb-1">HS Code (8-Digits) *</label>
                  <input
                    type="text"
                    required
                    value={newProd.hsCode || ''}
                    onChange={(e) => setNewProd({ ...newProd, hsCode: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 font-mono focus:border-amber-500 focus:outline-none"
                    placeholder="5208.1100"
                  />
                </div>
                <div>
                  <label className="text-stone-700 font-bold block mb-1">SKU / Code</label>
                  <input
                    type="text"
                    value={newProd.sku || ''}
                    onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 font-mono focus:border-amber-500 focus:outline-none"
                    placeholder="SKU-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-stone-700 font-bold block mb-1">UOM</label>
                  <input
                    type="text"
                    value={newProd.uom || 'PCS'}
                    onChange={(e) => setNewProd({ ...newProd, uom: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:border-amber-500 focus:outline-none font-mono"
                    placeholder="PCS, KGS, MTR"
                  />
                </div>
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Default Rate</label>
                  <input
                    type="number"
                    step="any"
                    value={newProd.defaultUnitPrice || ''}
                    onChange={(e) => setNewProd({ ...newProd, defaultUnitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:border-amber-500 focus:outline-none font-mono"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-stone-700 font-bold block mb-1">ST Rate (%)</label>
                  <input
                    type="number"
                    value={newProd.standardSalesTaxRate || 18}
                    onChange={(e) => setNewProd({ ...newProd, standardSalesTaxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
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
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
