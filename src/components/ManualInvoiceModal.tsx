import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import {
  NormalizedInvoice,
  NormalizedInvoiceItem,
  Workspace,
  NormalizedParty,
} from '../types/fbr';
import { validationEngine } from '../services/validationEngine';

interface ManualInvoiceModalProps {
  workspace: Workspace;
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: NormalizedInvoice) => void;
}

export function ManualInvoiceModal({
  workspace,
  isOpen,
  onClose,
  onSave,
}: ManualInvoiceModalProps) {
  if (!isOpen) return null;

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceType, setInvoiceType] = useState<'sales' | 'debit_note' | 'credit_note' | 'export'>('sales');
  const [referenceNumber, setReferenceNumber] = useState('');
  
  // Buyer
  const [buyerName, setBuyerName] = useState('');
  const [buyerNTN, setBuyerNTN] = useState('');
  const [buyerCNIC, setBuyerCNIC] = useState('');
  const [buyerType, setBuyerType] = useState<'registered_business' | 'unregistered_business' | 'end_consumer'>('registered_business');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerCity, setBuyerCity] = useState('');
  const [buyerProvince, setBuyerProvince] = useState('');
  const [paymentMode, setPaymentMode] = useState<'bank_transfer' | 'cash' | 'cheque' | 'credit_card'>('bank_transfer');

  // Items
  const [items, setItems] = useState<Array<{
    description: string;
    hsCode: string;
    uom: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    salesTaxRate: number;
    furtherTaxRate: number;
  }>>([
    {
      description: '',
      hsCode: '',
      uom: 'PCS',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      salesTaxRate: 18,
      furtherTaxRate: 0,
    },
  ]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        description: '',
        hsCode: '',
        uom: 'PCS',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        salesTaxRate: 18,
        furtherTaxRate: buyerType === 'unregistered_business' ? 3 : 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, idx) => idx !== index));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  // Calculations
  const calculatedItems: NormalizedInvoiceItem[] = items.map((item, idx) => {
    const taxableValue = (item.quantity * item.unitPrice) - item.discount;
    const salesTaxAmount = (taxableValue * item.salesTaxRate) / 100;
    const furtherTaxRate = buyerType === 'unregistered_business' && item.salesTaxRate > 0 ? 3 : 0;
    const furtherTaxAmount = (taxableValue * furtherTaxRate) / 100;
    const totalAmount = taxableValue + salesTaxAmount + furtherTaxAmount;

    return {
      id: `item_m_${Date.now()}_${idx}`,
      itemCode: `SKU-${idx + 1}`,
      hsCode: item.hsCode,
      description: item.description,
      uom: item.uom,
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      discount: Number(item.discount) || 0,
      taxableValue: Math.round((taxableValue + Number.EPSILON) * 100) / 100,
      salesTaxRate: Number(item.salesTaxRate) || 0,
      salesTaxAmount: Math.round((salesTaxAmount + Number.EPSILON) * 100) / 100,
      furtherTaxRate,
      furtherTaxAmount: Math.round((furtherTaxAmount + Number.EPSILON) * 100) / 100,
      extraTaxAmount: 0,
      totalAmount: Math.round((totalAmount + Number.EPSILON) * 100) / 100,
      isExempt: item.salesTaxRate === 0 && invoiceType !== 'export',
      isZeroRated: item.salesTaxRate === 0 && invoiceType === 'export',
    };
  });

  const totalQuantity = calculatedItems.reduce((acc, it) => acc + it.quantity, 0);
  const subtotalExclTax = calculatedItems.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
  const totalDiscount = calculatedItems.reduce((acc, it) => acc + it.discount, 0);
  const totalTaxableValue = calculatedItems.reduce((acc, it) => acc + it.taxableValue, 0);
  const totalSalesTax = calculatedItems.reduce((acc, it) => acc + it.salesTaxAmount, 0);
  const totalFurtherTax = calculatedItems.reduce((acc, it) => acc + it.furtherTaxAmount, 0);
  const grandTotal = calculatedItems.reduce((acc, it) => acc + it.totalAmount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!buyerName.trim()) {
      alert('Please provide Buyer Name.');
      return;
    }

    const seller: NormalizedParty = {
      name: workspace.profile.businessName,
      ntn: workspace.profile.ntn,
      strn: workspace.profile.strn,
      type: 'registered_business',
      address: workspace.profile.address,
      city: workspace.profile.city,
      province: workspace.profile.province,
    };

    const buyer: NormalizedParty = {
      name: buyerName.trim(),
      ntn: buyerNTN.trim() || undefined,
      cnic: buyerCNIC.trim() || undefined,
      type: buyerType,
      address: buyerAddress.trim() || '',
      city: buyerCity.trim() || '',
      province: buyerProvince.trim() || '',
    };

    const invoiceId = `inv_${Date.now()}`;

    const newInvoice: NormalizedInvoice = {
      id: invoiceId,
      workspaceId: workspace.id,
      invoiceNumber: invoiceNumber.trim(),
      invoiceType,
      invoiceDate,
      referenceNumber: referenceNumber.trim() || undefined,
      seller,
      buyer,
      paymentMode,
      currency: 'PKR',
      exchangeRate: 1,
      items: calculatedItems,
      summary: {
        totalQuantity,
        subtotalExclTax,
        totalDiscount,
        totalTaxableValue,
        totalSalesTax,
        totalFurtherTax,
        totalExtraTax: 0,
        grandTotal,
      },
      status: 'DRAFT',
      validationStatus: 'unvalidated',
      validationErrors: [],
      auditTrail: [
        {
          id: `aud_${Date.now()}`,
          workspaceId: workspace.id,
          timestamp: new Date().toISOString(),
          userId: 'usr_current',
          userName: 'Tax Operator',
          action: 'INVOICE_CREATED',
          invoiceId,
          invoiceNumber: invoiceNumber.trim(),
          details: `Created compliant tax invoice with ${calculatedItems.length} line item(s).`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'manual_entry',
    };

    // Run immediate validation
    const errors = validationEngine.validateInvoice(newInvoice);
    const hasBlocking = errors.some((e) => e.severity === 'ERROR');

    newInvoice.validationErrors = errors;
    newInvoice.validationStatus = hasBlocking ? 'invalid' : 'valid';
    newInvoice.status = hasBlocking ? 'DRAFT' : 'VALIDATED';

    onSave(newInvoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-stone-300 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">Create Compliant Sales Tax Invoice</h3>
              <p className="text-[11px] text-stone-600 font-medium">Pursuant to Pakistan Sales Tax Act 1990 & FBR Digital Invoicing Rules</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-stone-900">
          {/* Header Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div>
              <label className="text-stone-700 font-bold block mb-1">Invoice Number *</label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-2026-001"
                className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900 font-mono text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-stone-700 font-bold block mb-1">Invoice Date *</label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900 font-mono text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-stone-700 font-bold block mb-1">Invoice Type</label>
              <select
                value={invoiceType}
                onChange={(e) => setInvoiceType(e.target.value as any)}
                className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900 text-xs focus:border-amber-500 focus:outline-none font-medium"
              >
                <option value="sales">Standard Sales Invoice</option>
                <option value="debit_note">Debit Note (Adjustment)</option>
                <option value="credit_note">Credit Note (Adjustment)</option>
                <option value="export">Export Invoice (0% Zero-Rated)</option>
              </select>
            </div>
            <div>
              <label className="text-stone-700 font-bold block mb-1">Payment Method</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900 text-xs focus:border-amber-500 focus:outline-none font-medium"
              >
                <option value="bank_transfer">Direct Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="credit_card">Credit / Debit Card</option>
              </select>
            </div>
          </div>

          {/* Buyer Details */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
            <h4 className="font-bold text-stone-900 uppercase text-[11px] tracking-wider">Buyer (Customer) Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-stone-700 font-semibold block mb-1">Buyer Business Name *</label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900 text-xs focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. Registered Business Legal Name"
                />
              </div>
              <div>
                <label className="text-stone-700 font-semibold block mb-1">Buyer Classification</label>
                <select
                  value={buyerType}
                  onChange={(e) => setBuyerType(e.target.value as any)}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900 text-xs focus:border-amber-500 focus:outline-none font-medium"
                >
                  <option value="registered_business">Registered (Requires NTN)</option>
                  <option value="unregistered_business">Unregistered B2B (+3% Further Tax)</option>
                  <option value="end_consumer">End Consumer / Retail</option>
                </select>
              </div>
              <div>
                <label className="text-stone-700 font-semibold block mb-1">Buyer NTN (7-8 Digits)</label>
                <input
                  type="text"
                  value={buyerNTN}
                  onChange={(e) => setBuyerNTN(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900 font-mono text-xs focus:border-amber-500 focus:outline-none"
                  placeholder="1234567-8"
                />
              </div>
              <div>
                <label className="text-stone-700 font-semibold block mb-1">Buyer CNIC (13 Digits)</label>
                <input
                  type="text"
                  value={buyerCNIC}
                  onChange={(e) => setBuyerCNIC(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900 font-mono text-xs focus:border-amber-500 focus:outline-none"
                  placeholder="4210112345671"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-stone-700 font-semibold block mb-1">Buyer Address</label>
                <input
                  type="text"
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900 text-xs focus:border-amber-500 focus:outline-none"
                  placeholder="Street / Office Address"
                />
              </div>
              <div>
                <label className="text-stone-700 font-semibold block mb-1">Buyer City</label>
                <input
                  type="text"
                  value={buyerCity}
                  onChange={(e) => setBuyerCity(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900 text-xs focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. Karachi, Lahore, Islamabad"
                />
              </div>
              <div>
                <label className="text-stone-700 font-semibold block mb-1">Buyer Province</label>
                <input
                  type="text"
                  value={buyerProvince}
                  onChange={(e) => setBuyerProvince(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900 text-xs focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. Sindh, Punjab, ICT"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-stone-900 uppercase text-[11px] tracking-wider">Line Items</h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-amber-600" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 bg-stone-50 border border-stone-300 rounded-xl grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <label className="text-[10px] text-stone-600 font-bold block mb-0.5">Description</label>
                    <input
                      type="text"
                      required
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-stone-900 text-xs focus:border-amber-500 focus:outline-none font-medium"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-stone-600 font-bold block mb-0.5">HS Code</label>
                    <input
                      type="text"
                      placeholder="5208.1100"
                      value={item.hsCode}
                      onChange={(e) => handleItemChange(idx, 'hsCode', e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-stone-900 font-mono text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] text-stone-600 font-bold block mb-0.5">UOM</label>
                    <input
                      type="text"
                      placeholder="UOM"
                      value={item.uom}
                      onChange={(e) => handleItemChange(idx, 'uom', e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-stone-900 font-mono text-center text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] text-stone-600 font-bold block mb-0.5">Qty</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-stone-900 font-mono text-right text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-stone-600 font-bold block mb-0.5">Unit Price (PKR)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Rate"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-stone-900 font-mono text-right text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] text-stone-600 font-bold block mb-0.5">ST %</label>
                    <input
                      type="number"
                      placeholder="18"
                      value={item.salesTaxRate}
                      onChange={(e) => handleItemChange(idx, 'salesTaxRate', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-stone-900 font-mono text-right text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-1 text-center pt-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length === 1}
                      className="p-1 text-stone-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calculations Total Summary */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex justify-end">
            <div className="w-80 space-y-1 font-mono text-xs text-right">
              <div className="flex justify-between text-stone-700">
                <span>Taxable Value:</span>
                <span className="font-bold text-stone-900">PKR {totalTaxableValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-800 font-bold">
                <span>Sales Tax (18%):</span>
                <span>PKR {totalSalesTax.toFixed(2)}</span>
              </div>
              {totalFurtherTax > 0 && (
                <div className="flex justify-between text-amber-900 font-bold">
                  <span>Further Tax (3% Sec 3(1A)):</span>
                  <span>PKR {totalFurtherTax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-stone-950 border-t-2 border-stone-400 pt-1.5">
                <span>Grand Total:</span>
                <span className="text-amber-800">PKR {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Save Compliant Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
