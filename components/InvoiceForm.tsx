
import React, { useState, useEffect } from 'react';
import { dataService, ReferralVoucher } from '../services/mockData';
import { Card } from './common/Card';
import { InvoiceItem, PaymentMode, Voucher, PackageSubscription } from '../types';
import { GST_RATE } from '../constants';

export const InvoiceForm: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const staffList = dataService.getStaff();
  const services = dataService.getServices();
  
  const selectableStaff = staffList.filter(s => s.role === 'Staff');
  
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [activeReferral, setActiveReferral] = useState<ReferralVoucher | null>(null);
  const [activePackage, setActivePackage] = useState<PackageSubscription | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(PaymentMode.CASH);
  const [discount, setDiscount] = useState(0);
  const [selectedVoucherCode, setSelectedVoucherCode] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', serviceName: '', price: 0, quantity: 1, staffId: '' }
  ]);

  useEffect(() => {
    if (customerMobile.length >= 10) {
      const customer = dataService.findCustomer(customerMobile);
      const vouchersData = dataService.getVouchersByMobile(customerMobile);
      const salonId = dataService.getActiveSalonId();
      const subs = dataService.getPackageSubscriptions(salonId);
      const customerSub = subs.find(s => s.customerMobile === customerMobile && s.status === 'Active');
      
      setActivePackage(customerSub || null);
      setAvailableVouchers(vouchersData.system);
      
      // Auto-populate logic: If an active referral exists, prioritize it.
      // Otherwise, check if a valid system policy voucher exists for this customer/site.
      if (vouchersData.referrals.length > 0) {
        const referral = vouchersData.referrals[0];
        setActiveReferral(referral);
        setSelectedVoucherCode(referral.id);
      } else {
        setActiveReferral(null);
        const policyVoucher = vouchersData.system.find(v => v.code === 'POLICY35');
        if (policyVoucher) {
          setSelectedVoucherCode(policyVoucher.code);
        } else {
          setSelectedVoucherCode('');
        }
      }

      if (customer) {
        setCustomerName(customer.name);
        setIsNewCustomer(false);
      } else {
        setIsNewCustomer(true);
        setCustomerName('');
      }
    } else {
      setIsNewCustomer(false);
      setAvailableVouchers([]);
      setActiveReferral(null);
      setActivePackage(null);
      setSelectedVoucherCode('');
    }
  }, [customerMobile]);

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), serviceName: '', price: 0, quantity: 1, staffId: '' }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleServiceSelect = (id: string, serviceName: string) => {
    const service = services.find(s => s.name === serviceName);
    if (service) {
      setItems(items.map(item => 
        item.id === id ? { ...item, serviceName: service.name, price: service.basePrice } : item
      ));
    } else {
      updateItem(id, 'serviceName', serviceName);
    }
  };

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const handleVoucherApply = (code: string) => {
    setSelectedVoucherCode(code);
    if (code === 'POLICY35' || (activeReferral && code === activeReferral.id)) {
      setDiscount(subtotal * 0.35);
    } else {
      const voucher = availableVouchers.find(v => v.code === code);
      if (voucher) {
        setDiscount(voucher.balance);
      } else {
        setDiscount(0);
      }
    }
  };

  useEffect(() => {
    if (selectedVoucherCode === 'POLICY35' || (activeReferral && selectedVoucherCode === activeReferral.id)) {
      setDiscount(subtotal * 0.35);
    }
  }, [subtotal, selectedVoucherCode, activeReferral]);

  const gst = subtotal * GST_RATE;
  const total = Math.max(0, (subtotal + gst) - discount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerMobile || !customerName || items.some(i => !i.serviceName || !i.staffId)) {
      alert("Please ensure Customer Mobile, Name, and all Service items (Staff + Service) are filled.");
      return;
    }

    if (paymentMode === PaymentMode.PACKAGE && activePackage && activePackage.currentBalance < total) {
      alert(`Insufficient balance in Package Wallet. Available: ₹${activePackage.currentBalance}. Required: ₹${total}.`);
      return;
    }

    const invoice = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      salonId: dataService.getActiveSalonId(),
      customerName,
      customerMobile,
      items,
      subtotal,
      discount,
      gst,
      total,
      paymentMode,
      date: new Date().toISOString()
    };

    dataService.addInvoice(invoice);
    onComplete();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Checkout Terminal</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Terminal: {dataService.getActiveSalon()?.name}</p>
        </div>
        <button 
          onClick={onComplete}
          className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 hover:text-slate-800 transition shadow-inner"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card title="1. Customer Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mobile Number *</label>
                <input 
                  type="tel" 
                  required
                  autoFocus
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-slate-800 shadow-inner"
                  value={customerMobile}
                  onChange={e => setCustomerMobile(e.target.value)}
                  placeholder="Enter 10-digit mobile"
                />
              </div>
              <div className="relative">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Customer Name *</label>
                <input 
                  type="text" 
                  required
                  className={`w-full px-5 py-4 border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black transition-all ${
                    isNewCustomer ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder={isNewCustomer ? "Provide Name for New Record..." : "Auto-populating..."}
                />
                {isNewCustomer && customerMobile.length >= 10 && (
                  <span className="absolute -bottom-6 right-2 text-[9px] font-black text-amber-600 uppercase animate-pulse">✨ New Client Discovery</span>
                )}
              </div>
            </div>
            {activePackage && (
               <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="text-2xl">💳</div>
                   <div>
                     <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Value Package</p>
                     <p className="text-sm font-black text-slate-800">{activePackage.templateName}</p>
                   </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Credits</p>
                    <p className="text-lg font-black text-emerald-600">₹{activePackage.currentBalance.toLocaleString()}</p>
                 </div>
               </div>
            )}
          </Card>

          <Card title="2. Service Configuration (Staff First)">
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/50 p-4 rounded-2xl border border-slate-100 shadow-inner group transition-all hover:bg-white hover:border-indigo-100">
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Staff *</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm shadow-sm"
                      value={item.staffId}
                      onChange={e => updateItem(item.id, 'staffId', e.target.value)}
                    >
                      <option value="">Staff Member</option>
                      {selectableStaff.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Service Item *</label>
                    <div className="relative">
                      <select
                        required
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm shadow-sm appearance-none"
                        value={item.serviceName}
                        onChange={e => handleServiceSelect(item.id, e.target.value)}
                      >
                        <option value="">Choose Service...</option>
                        {services.map(s => (
                          <option key={s.id} value={s.name}>{s.name} (₹{s.basePrice})</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 text-xs">▼</div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Rate (₹)</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm shadow-sm"
                      value={item.price || ''}
                      onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Qty</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm shadow-sm"
                      value={item.quantity}
                      onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="md:col-span-1 flex justify-center pb-1">
                    <button 
                      type="button" 
                      onClick={() => removeItem(item.id)}
                      className="w-10 h-10 flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition shadow-sm border border-transparent hover:border-rose-100"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              <button 
                type="button" 
                onClick={addItem}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition font-black uppercase tracking-widest text-[10px] shadow-sm"
              >
                + Append Service Row
              </button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card title="Payment & Vouchers">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Voucher Status (Lookup Active)</label>
                <div className="relative">
                   <select
                    className={`w-full px-4 py-4 rounded-2xl border font-black text-xs uppercase tracking-tighter outline-none transition-all shadow-sm appearance-none ${
                      (availableVouchers.length > 0 || activeReferral) ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-indigo-100' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
                    }`}
                    value={selectedVoucherCode}
                    onChange={e => handleVoucherApply(e.target.value)}
                    disabled={customerMobile.length < 10}
                  >
                    <option value="">{availableVouchers.length > 0 || activeReferral ? 'Select Active Voucher' : (customerMobile.length >= 10 ? 'No Active Vouchers Found' : 'Enter Mobile First')}</option>
                    
                    {activeReferral && (
                      <option key={activeReferral.id} value={activeReferral.id}>REFERRAL: {activeReferral.id} (35% OFF)</option>
                    )}
                    
                    {availableVouchers.map(v => (
                      <option key={v.id} value={v.code}>{v.code} ({v.code === 'POLICY35' ? '35% Discount' : `Worth ₹${v.balance}`})</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">⚡</div>
                </div>
                {(selectedVoucherCode === 'POLICY35' || (activeReferral && selectedVoucherCode === activeReferral.id)) && (
                  <p className="mt-2 text-[9px] font-black text-indigo-500 uppercase tracking-widest animate-pulse">🎉 35% Discount Applied!</p>
                )}
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Manual Adjust (₹)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 shadow-inner"
                  value={discount || ''}
                  onChange={e => {
                    setDiscount(parseFloat(e.target.value) || 0);
                    setSelectedVoucherCode('');
                  }}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Settlement Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(PaymentMode).map(mode => {
                    const isPackage = mode === PaymentMode.PACKAGE;
                    const isDisabled = isPackage && !activePackage;
                    return (
                      <button
                        key={mode}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setPaymentMode(mode)}
                        className={`px-3 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                          paymentMode === mode 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                            : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                        } ${isDisabled ? 'opacity-30 cursor-not-allowed line-through' : ''}`}
                      >
                        {mode}
                      </button>
                    );
                  })}
                </div>
                {activePackage && paymentMode !== PaymentMode.PACKAGE && (
                  <p className="mt-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest text-center">💡 Wallet payment available</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="bg-[#1E293B] text-white shadow-2xl border-none overflow-hidden">
            <div className="p-8 space-y-5">
              <div className="flex justify-between text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <span>Net Total</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <span>Tax (GST 5%)</span>
                <span>+₹{gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-400 text-[10px] font-black uppercase tracking-widest">
                <span>Total Discount</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-700/50 pt-6 flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Total Payable Amount</span>
                <span className="text-4xl font-black text-emerald-400 tracking-tight">₹{total.toFixed(2)}</span>
              </div>
              <button 
                type="submit"
                className="w-full py-6 bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-500/20 mt-4 active:scale-95"
              >
                Execute Checkout
              </button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
};
