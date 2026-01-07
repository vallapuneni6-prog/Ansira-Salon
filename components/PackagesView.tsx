
import React, { useState, useEffect, useRef } from 'react';
import { Card } from './common/Card';
import { dataService } from '../services/mockData';
import { PackageSubscription, SittingPackageTemplate, SittingPackageSubscription, Staff, Service, PackageTemplate, Salon } from '../types';
import html2canvas from 'html2canvas';

type PackageTab = 'value' | 'sitting';

interface PackageItemRow {
  id: string;
  staffId: string;
  serviceName: string;
  quantity: number;
  price: number;
}

interface HistoricReceiptData {
  sub: PackageSubscription | SittingPackageSubscription;
  items: { serviceName: string; quantity: number; price: number }[];
  date: string;
  description: string;
  packageName: string;
  packagePaidAmount: number;
  openingBalance: number | string;
  transactionAmount: number | string;
  closingBalance: number | string;
  isSitting: boolean;
}

const LOGO_URL = "https://i.imgur.com/pYxRj8p.png";

export const PackagesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PackageTab>('value');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showRedeemForm, setShowRedeemForm] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  
  const [redeemingValueSub, setRedeemingValueSub] = useState<PackageSubscription | null>(null);
  const [redeemingSittingSub, setRedeemingSittingSub] = useState<SittingPackageSubscription | null>(null);
  const [sittingRedeemStaffId, setSittingRedeemStaffId] = useState('');

  const [activeSubscriptions, setActiveSubscriptions] = useState<PackageSubscription[]>([]);
  const [activeSittingSubs, setActiveSittingSubs] = useState<SittingPackageSubscription[]>([]);
  const [viewingReceipt, setViewingReceipt] = useState<HistoricReceiptData | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'capturing' | 'copied' | 'error'>('idle');
  
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  const [items, setItems] = useState<PackageItemRow[]>([
    { id: '1', staffId: '', serviceName: '', quantity: 1, price: 0 }
  ]);

  const [selectedSittingTemplateId, setSelectedSittingTemplateId] = useState('');
  const [selectedSittingServiceId, setSelectedSittingServiceId] = useState('');
  const [sittingServiceValue, setSittingServiceValue] = useState<number>(0);
  const [sittingInitialStaffId, setSittingInitialStaffId] = useState('');

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [templates, setTemplates] = useState<PackageTemplate[]>([]);
  const [sittingTemplates, setSittingTemplates] = useState<SittingPackageTemplate[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [activeSalon, setActiveSalon] = useState<Salon | undefined>(undefined);

  const salonId = dataService.getActiveSalonId();

  useEffect(() => {
    const loadRegistry = async () => {
      const [subs, sits, staff, tmpls, sitTmpls, svcs, salon] = await Promise.all([
        dataService.getPackageSubscriptions(salonId || undefined),
        dataService.getSittingPackageSubscriptions(salonId || undefined),
        dataService.getStaff(salonId || undefined),
        dataService.getPackageTemplates(),
        dataService.getSittingPackageTemplates(),
        dataService.getServices(),
        dataService.getActiveSalon()
      ]);
      setActiveSubscriptions(subs);
      setActiveSittingSubs(sits);
      setStaffList(staff.filter(s => s.role === 'Staff'));
      setTemplates(tmpls);
      setSittingTemplates(sitTmpls);
      setServices(svcs);
      setActiveSalon(salon);
    };
    loadRegistry();
  }, [salonId, showAssignForm, showRedeemForm, viewingReceipt]);

  useEffect(() => {
    const lookupCustomer = async () => {
      if (customerMobile.length >= 10) {
        const customer = await dataService.findCustomer(customerMobile);
        if (customer) {
          setCustomerName(customer.name);
          setIsNewCustomer(false);
        } else {
          setIsNewCustomer(true);
          setCustomerName('');
        }
      } else {
        setIsNewCustomer(false);
      }
    };
    lookupCustomer();
  }, [customerMobile]);

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), staffId: '', serviceName: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof PackageItemRow, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'serviceName') {
          const svc = services.find(s => s.name === value);
          if (svc) updated.price = svc.basePrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleServiceSelect = (id: string, serviceName: string) => {
    updateItem(id, 'serviceName', serviceName);
  };

  const calculateItemsTotalComponents = () => {
    const validItems = items.filter(i => i.serviceName);
    const subtotal = validItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const gst = subtotal * 0.05;
    const total = subtotal + gst;
    return { subtotal, gst, total };
  };

  const handleValueAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template || !customerMobile || !customerName) {
      alert("Missing template, mobile or name.");
      return;
    }

    const { total: itemsDeduction } = calculateItemsTotalComponents();
    const validItems = items.filter(i => i.serviceName);
    
    if (itemsDeduction > template.offeredValue) {
      alert("Initial deduction exceeds wallet value!");
      return;
    }

    const expiry = new Date(assignedDate);
    expiry.setFullYear(expiry.getFullYear() + 1);
    const expiryStr = expiry.toISOString().split('T')[0];

    const historyItems = validItems.map(i => ({ serviceName: i.serviceName, quantity: i.quantity, price: i.price, staffId: i.staffId }));

    const history: PackageSubscription['history'] = [
      { 
        date: assignedDate, 
        amount: template.offeredValue, 
        description: `Wallet Activation: ${template.name}`, 
        balanceAfter: template.offeredValue
      }
    ];

    if (itemsDeduction > 0) {
      history.push({
        date: assignedDate,
        amount: -itemsDeduction,
        description: `Initial Consumption`,
        balanceAfter: template.offeredValue - itemsDeduction,
        items: historyItems
      });
    }

    const newSub: PackageSubscription = {
      id: `VAL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      salonId: salonId || 's1',
      customerMobile,
      customerName,
      templateId: template.id,
      templateName: template.name.split(' (')[0],
      initialValue: template.offeredValue,
      currentBalance: template.offeredValue - itemsDeduction,
      paidAmount: template.paidAmount,
      assignedDate,
      expiryDate: expiryStr,
      status: 'Active',
      history: history
    };

    await dataService.addPackageSubscription(newSub);
    
    setViewingReceipt({
      sub: newSub,
      items: historyItems,
      date: assignedDate,
      description: `Value Package Activation`,
      packageName: newSub.templateName,
      packagePaidAmount: newSub.paidAmount,
      openingBalance: itemsDeduction > 0 ? newSub.initialValue : 0,
      transactionAmount: itemsDeduction,
      closingBalance: newSub.currentBalance,
      isSitting: false
    });

    setShowAssignForm(false);
    resetForm();
  };

  const handleSittingAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const template = sittingTemplates.find(t => t.id === selectedSittingTemplateId);
    const service = services.find(s => s.id === selectedSittingServiceId);
    
    if (!template || !service || !customerMobile || !customerName) return;

    const baseValue = sittingServiceValue * template.paidSittings;
    const gstVal = baseValue * 0.05;
    const grandTotal = baseValue + gstVal;

    const expiry = new Date(assignedDate);
    expiry.setFullYear(expiry.getFullYear() + 1);
    const expiryStr = expiry.toISOString().split('T')[0];

    const isInitialRedeem = !!sittingInitialStaffId;
    const history: SittingPackageSubscription['history'] = [{
      date: assignedDate,
      staffId: 'system',
      staffName: 'Package Creation',
      type: 'Activation'
    }];

    if (isInitialRedeem) {
      const staff = staffList.find(s => s.id === sittingInitialStaffId);
      history.push({
        date: assignedDate,
        staffId: sittingInitialStaffId,
        staffName: staff?.name || 'Stylist',
        type: 'Redemption'
      });
    }

    const newSub: SittingPackageSubscription = {
      id: `STG-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      salonId: salonId || 's1',
      customerMobile,
      customerName,
      templateId: template.id,
      serviceName: service.name,
      unitPrice: sittingServiceValue,
      totalSittings: template.totalSittings,
      sittingsUsed: isInitialRedeem ? 1 : 0,
      remainingSittings: template.totalSittings - (isInitialRedeem ? 1 : 0),
      expiryDate: expiryStr,
      status: 'Active',
      paidAmount: grandTotal,
      assignedDate: assignedDate,
      history
    };

    await dataService.addSittingPackageSubscription(newSub);
    setViewingReceipt({
      sub: newSub,
      items: [{ serviceName: service.name, quantity: 1, price: sittingServiceValue }],
      date: assignedDate,
      description: `Sittings Package Activation`,
      packageName: template.name,
      packagePaidAmount: newSub.paidAmount,
      openingBalance: newSub.totalSittings,
      transactionAmount: isInitialRedeem ? 1 : 0,
      closingBalance: newSub.remainingSittings,
      isSitting: true
    });
    setShowAssignForm(false);
    resetForm();
  };

  const handleValueRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemingValueSub) return;
    const { total: totalToDeduct } = calculateItemsTotalComponents();
    if (totalToDeduct <= 0) return;
    if (totalToDeduct > redeemingValueSub.currentBalance) {
      alert(`Insufficient Balance! Required: ₹${totalToDeduct.toLocaleString()}, Available: ₹${redeemingValueSub.currentBalance.toLocaleString()}`);
      return;
    }
    const validItems = items.filter(i => i.serviceName);
    const historyItems = validItems.map(i => ({ serviceName: i.serviceName, quantity: i.quantity, price: i.price, staffId: i.staffId }));
    const updatedSub = await dataService.deductFromPackage(redeemingValueSub.customerMobile, totalToDeduct, `RED-${Date.now().toString().slice(-4)}`, validItems as any);
    
    if (updatedSub) {
      setViewingReceipt({
        sub: updatedSub,
        items: historyItems,
        date: new Date().toISOString().split('T')[0],
        description: 'Package Redemption',
        packageName: updatedSub.templateName,
        packagePaidAmount: updatedSub.paidAmount,
        openingBalance: updatedSub.currentBalance + totalToDeduct,
        transactionAmount: totalToDeduct,
        closingBalance: updatedSub.currentBalance,
        isSitting: false
      });
    }
    setShowRedeemForm(false);
    setRedeemingValueSub(null);
    resetForm();
  };

  const handleSittingRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemingSittingSub || !sittingRedeemStaffId) return;
    const staff = staffList.find(s => s.id === sittingRedeemStaffId);
    if (!staff) return;
    
    const updated = await dataService.redeemSittingPackage(redeemingSittingSub.id, staff.id, staff.name);
    if (updated) {
      const template = sittingTemplates.find(t => t.id === updated.templateId);
      setViewingReceipt({
        sub: updated,
        items: [{ serviceName: updated.serviceName, quantity: 1, price: updated.unitPrice }],
        date: new Date().toISOString().split('T')[0],
        description: 'Sitting Redemption',
        packageName: template?.name || 'Sitting Bundle',
        packagePaidAmount: updated.paidAmount,
        openingBalance: updated.remainingSittings + 1,
        transactionAmount: 1,
        closingBalance: updated.remainingSittings,
        isSitting: true
      });
      setShowRedeemForm(false);
      setRedeemingSittingSub(null);
      setSittingRedeemStaffId('');
    }
  };

  const resetForm = () => {
    setCustomerMobile('');
    setCustomerName('');
    setAssignedDate(new Date().toISOString().split('T')[0]);
    setSelectedTemplateId('');
    setSelectedSittingTemplateId('');
    setSelectedSittingServiceId('');
    setSittingServiceValue(0);
    setSittingInitialStaffId('');
    setItems([{ id: '1', staffId: '', serviceName: '', quantity: 1, price: 0 }]);
    setSittingRedeemStaffId('');
    setIsNewCustomer(false);
  };

  const handleShareReceipt = async () => {
    const element = document.getElementById('package-receipt-content');
    if (!element) return;
    setShareStatus('capturing');
    try {
      const canvas = await html2canvas(element, { useCORS: true, scale: 2 });
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setShareStatus('copied');
        const text = encodeURIComponent(`*Greetings from ${activeSalon?.name}!*\n\nPlease find attached your package transaction summary.`);
        setTimeout(() => {
          window.open(`https://web.whatsapp.com/send?phone=91${viewingReceipt?.sub.customerMobile}&text=${text}`, '_blank');
          setShareStatus('idle');
        }, 1500);
      }
    } catch (err) {
      setShareStatus('error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Prepaid Subscriptions</h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Wallet & Service Bundle Management</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
            <button onClick={() => setActiveTab('value')} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'value' ? 'bg-[#7C3AED] text-white' : 'text-slate-500'}`}>Value Wallets</button>
            <button onClick={() => setActiveTab('sitting')} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'sitting' ? 'bg-[#7C3AED] text-white' : 'text-slate-500'}`}>Sitting Bundles</button>
          </div>
          <button onClick={() => { resetForm(); setShowAssignForm(true); }} className="px-8 py-3 bg-[#1E293B] text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl hover:bg-black transition-all">+ Assign New</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-lg rounded-[1.5rem] bg-white p-5 flex flex-col justify-center h-24">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Members</p>
           <h2 className="text-2xl font-black text-slate-900">{activeTab === 'value' ? activeSubscriptions.length : activeSittingSubs.length}</h2>
        </Card>
        <Card className="border-none shadow-lg rounded-[1.5rem] bg-indigo-50 border-indigo-100 p-5 flex flex-col justify-center h-24">
           <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Context Exposure</p>
           <h2 className="text-2xl font-black text-indigo-700">₹{activeTab === 'value' ? activeSubscriptions.reduce((acc, s) => acc + s.currentBalance, 0).toLocaleString() : 'N/A'}</h2>
        </Card>
        <Card className="border-none shadow-lg rounded-[1.5rem] bg-emerald-50 border-emerald-100 p-5 flex flex-col justify-center h-24">
           <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Redemptions (MTD)</p>
           <h2 className="text-2xl font-black text-emerald-700">₹{activeTab === 'value' ? 'Calculated' : activeSittingSubs.reduce((acc, s) => acc + s.sittingsUsed, 0)}</h2>
        </Card>
      </div>

      <Card title={activeTab === 'value' ? "Value Wallet Registry" : "Service Bundle Registry"} className="border-none shadow-xl rounded-[2rem] overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Package Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Expiry</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Balance</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activeTab === 'value' ? (
                activeSubscriptions.length > 0 ? activeSubscriptions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/30 transition group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-slate-900">{sub.customerName}</div>
                      <div className="text-[10px] font-bold text-slate-400">{sub.customerMobile}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-black text-indigo-600 uppercase">{sub.templateName}</div>
                      <div className="text-[9px] font-bold text-slate-400">Issued: {sub.assignedDate}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{sub.expiryDate}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-black text-emerald-600">₹{sub.currentBalance.toLocaleString()}</div>
                      <div className="text-[9px] font-bold text-slate-300 uppercase">of ₹{sub.initialValue.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => { resetForm(); setRedeemingValueSub(sub); setShowRedeemForm(true); }} className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg hover:bg-indigo-600 hover:text-white transition">Redeem</button>
                    </td>
                  </tr>
                )) : <tr><td colSpan={5} className="py-20 text-center text-slate-300 uppercase text-xs font-black">No Active Wallets</td></tr>
              ) : (
                activeSittingSubs.length > 0 ? activeSittingSubs.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/30 transition group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-slate-900">{sub.customerName}</div>
                      <div className="text-[10px] font-bold text-slate-400">{sub.customerMobile}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-black text-indigo-600 uppercase">{sub.serviceName} Bundle</div>
                      <div className="text-[9px] font-bold text-slate-400">Issued: {sub.assignedDate}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{sub.expiryDate}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-black text-amber-600">{sub.remainingSittings} Sittings</div>
                      <div className="text-[9px] font-bold text-slate-300 uppercase">of {sub.totalSittings} Total</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => { resetForm(); setRedeemingSittingSub(sub); setShowRedeemForm(true); }} className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg hover:bg-indigo-600 hover:text-white transition">Redeem</button>
                    </td>
                  </tr>
                )) : <tr><td colSpan={5} className="py-20 text-center text-slate-300 uppercase text-xs font-black">No Active Bundles</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ASSIGN MODAL */}
      {showAssignForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-100">
             <button onClick={() => setShowAssignForm(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 text-2xl">✕</button>
             <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-8">Assign New Subscriptions</h2>
             
             <div className="space-y-8">
               <Card title="Customer & Timing" className="bg-slate-50/50 border-none">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile No *</label>
                     <input required className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-black text-slate-800" value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} placeholder="10-digit mobile" />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Name *</label>
                     <input required className={`w-full px-5 py-4 border rounded-2xl outline-none font-black ${isNewCustomer ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Full Name" />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Activation Date *</label>
                     <input type="date" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-black" value={assignedDate} onChange={e => setAssignedDate(e.target.value)} />
                   </div>
                 </div>
               </Card>

               {activeTab === 'value' ? (
                 <form onSubmit={handleValueAssignSubmit} className="space-y-8">
                   <Card title="Wallet Selection" className="border-none">
                     <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Wallet Plan *</label>
                       <select 
                         required 
                         className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-black text-slate-800 appearance-none cursor-pointer"
                         value={selectedTemplateId}
                         onChange={e => setSelectedTemplateId(e.target.value)}
                       >
                         <option value="">Choose a plan...</option>
                         {templates.map(t => (
                           <option key={t.id} value={t.id}>{t.name} (Pay ₹{t.paidAmount.toLocaleString()} Get ₹{t.offeredValue.toLocaleString()})</option>
                         ))}
                       </select>
                     </div>
                   </Card>

                   <Card title="Immediate Service Consumption (Optional)" className="border-none bg-indigo-50/30">
                     <div className="space-y-4">
                       {items.map(item => (
                         <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                           <div className="md:col-span-3">
                             <select className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm" value={item.staffId} onChange={e => updateItem(item.id, 'staffId', e.target.value)}>
                               <option value="">Staff</option>
                               {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                             </select>
                           </div>
                           <div className="md:col-span-5">
                             <select className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm" value={item.serviceName} onChange={e => handleServiceSelect(item.id, e.target.value)}>
                               <option value="">Choose Service...</option>
                               {services.map(s => <option key={s.id} value={s.name}>{s.name} (₹{s.basePrice})</option>)}
                             </select>
                           </div>
                           <div className="md:col-span-3">
                             <input type="number" className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm" value={item.price || ''} onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)} placeholder="Rate" />
                           </div>
                           <div className="md:col-span-1">
                             <button type="button" onClick={() => removeItem(item.id)} className="w-full py-3 text-rose-300 hover:text-rose-500 transition">🗑️</button>
                           </div>
                         </div>
                       ))}
                       <button type="button" onClick={addItem} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-2 hover:underline">+ Add Entry</button>
                     </div>
                   </Card>
                   
                   <div className="flex gap-4">
                     <button type="submit" className="flex-[2] py-5 bg-[#0F172A] text-white font-black rounded-3xl uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Assign & Finalize</button>
                     <button type="button" onClick={() => setShowAssignForm(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black rounded-3xl uppercase tracking-widest text-xs">Cancel</button>
                   </div>
                 </form>
               ) : (
                 <form onSubmit={handleSittingAssignSubmit} className="space-y-8">
                    <Card title="Bundle Configuration" className="border-none">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Type *</label>
                           <select required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black" value={selectedSittingServiceId} onChange={e => {
                             setSelectedSittingServiceId(e.target.value);
                             const svc = services.find(s => s.id === e.target.value);
                             if (svc) setSittingServiceValue(svc.basePrice);
                           }}>
                             <option value="">Select Target Service</option>
                             {services.map(s => <option key={s.id} value={s.id}>{s.name} (₹{s.basePrice})</option>)}
                           </select>
                         </div>
                         <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Manual Price Override (₹)</label>
                           <input type="number" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-black" value={sittingServiceValue || ''} onChange={e => setSittingServiceValue(parseFloat(e.target.value) || 0)} />
                         </div>
                      </div>
                      
                      <div className="space-y-1.5 mt-8">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Bundle Plan *</label>
                        <select 
                          required 
                          className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-black text-slate-800 appearance-none cursor-pointer"
                          value={selectedSittingTemplateId}
                          onChange={e => setSelectedSittingTemplateId(e.target.value)}
                        >
                          <option value="">Choose a bundle...</option>
                          {sittingTemplates.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.totalSittings} Sittings: {t.paidSittings} Paid + {t.compSittings} Free)</option>
                          ))}
                        </select>
                      </div>
                    </Card>

                    <Card title="Redeem First Sitting? (Optional)" className="border-none bg-amber-50/30">
                       <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stylist In-Charge</label>
                         <select className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-black" value={sittingInitialStaffId} onChange={e => setSittingInitialStaffId(e.target.value)}>
                           <option value="">No Initial Redemption</option>
                           {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                         </select>
                       </div>
                    </Card>

                    <div className="flex gap-4">
                     <button type="submit" className="flex-[2] py-5 bg-[#0F172A] text-white font-black rounded-3xl uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Confirm Bundle</button>
                     <button type="button" onClick={() => setShowAssignForm(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black rounded-3xl uppercase tracking-widest text-xs">Cancel</button>
                    </div>
                 </form>
               )}
             </div>
          </div>
        </div>
      )}

      {/* REDEEM MODAL */}
      {showRedeemForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl relative border border-slate-100 animate-in zoom-in duration-300">
             <button onClick={() => setShowRedeemForm(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 text-2xl">✕</button>
             <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Redeem Subscription</h2>
             
             {redeemingValueSub ? (
               <form onSubmit={handleValueRedeemSubmit} className="space-y-8">
                 <div className="bg-indigo-50 p-6 rounded-2xl flex justify-between items-center mb-6">
                    <div>
                       <p className="text-[10px] font-black text-indigo-400 uppercase">Available Balance</p>
                       <p className="text-2xl font-black text-indigo-900">₹{redeemingValueSub.currentBalance.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase">Client</p>
                       <p className="text-sm font-black text-slate-900">{redeemingValueSub.customerName}</p>
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                   {items.map(item => (
                     <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                       <div className="md:col-span-4">
                         <select className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm" value={item.staffId} onChange={e => updateItem(item.id, 'staffId', e.target.value)}>
                           <option value="">Staff</option>
                           {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                         </select>
                       </div>
                       <div className="md:col-span-5">
                         <select className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm" value={item.serviceName} onChange={e => handleServiceSelect(item.id, e.target.value)}>
                           <option value="">Service</option>
                           {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                         </select>
                       </div>
                       <div className="md:col-span-2">
                         <input type="number" className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm" value={item.price || ''} onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)} placeholder="₹" />
                       </div>
                       <div className="md:col-span-1">
                          <button type="button" onClick={() => removeItem(item.id)} className="w-full py-3 text-rose-300">🗑️</button>
                       </div>
                     </div>
                   ))}
                   <button type="button" onClick={addItem} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">+ Add Row</button>
                 </div>

                 <button type="submit" className="w-full py-5 bg-[#0F172A] text-white font-black rounded-3xl uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Confirm Deduction</button>
               </form>
             ) : redeemingSittingSub ? (
               <form onSubmit={handleSittingRedeemSubmit} className="space-y-8">
                  <div className="bg-amber-50 p-6 rounded-2xl flex justify-between items-center mb-6">
                    <div>
                       <p className="text-[10px] font-black text-amber-400 uppercase">Remaining Sittings</p>
                       <p className="text-2xl font-black text-amber-900">{redeemingSittingSub.remainingSittings} Left</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase">Service</p>
                       <p className="text-sm font-black text-slate-900">{redeemingSittingSub.serviceName}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Stylist for this Sitting *</label>
                    <select required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black" value={sittingRedeemStaffId} onChange={e => setSittingRedeemStaffId(e.target.value)}>
                      <option value="">Select Stylist</option>
                      {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <button type="submit" className="w-full py-5 bg-amber-500 text-white font-black rounded-3xl uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Redeem Sitting</button>
               </form>
             ) : null}
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
           <div id="package-receipt-content" className="w-full max-w-[400px] bg-white p-8 border-t-[10px] border-indigo-600 shadow-2xl relative">
              <div className="text-center mb-6">
                 <img src={LOGO_URL} alt="Logo" className="h-12 mx-auto mb-2" />
                 <h4 className="text-lg font-black uppercase text-slate-900">{activeSalon?.name}</h4>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{activeSalon?.address}</p>
              </div>

              <div className="border-y border-dashed border-slate-200 py-4 my-4 space-y-1">
                 <div className="flex justify-between text-[11px] font-bold text-slate-400">
                    <span>TRANSACTION ID:</span>
                    <span className="text-slate-900">#{viewingReceipt.sub.id}</span>
                 </div>
                 <div className="flex justify-between text-[11px] font-bold text-slate-400">
                    <span>DATE:</span>
                    <span className="text-slate-900">{viewingReceipt.date}</span>
                 </div>
                 <div className="flex justify-between text-[11px] font-bold text-slate-400">
                    <span>CUSTOMER:</span>
                    <span className="text-slate-900 uppercase">{viewingReceipt.sub.customerName}</span>
                 </div>
              </div>

              <div className="mb-6">
                 <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">{viewingReceipt.description}</h5>
                 <div className="space-y-3">
                   {viewingReceipt.items.map((item, i) => (
                     <div key={i} className="flex justify-between text-xs font-bold text-slate-800">
                        <span>{item.serviceName} x{item.quantity}</span>
                        <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                     </div>
                   ))}
                 </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                 <div className="flex justify-between text-[11px] font-bold text-slate-400">
                    <span>OPENING BALANCE:</span>
                    <span className="text-slate-900">{viewingReceipt.isSitting ? `${viewingReceipt.openingBalance} Sittings` : `₹${Number(viewingReceipt.openingBalance).toLocaleString()}`}</span>
                 </div>
                 <div className="flex justify-between text-[11px] font-bold text-slate-400">
                    <span>CONSUMPTION:</span>
                    <span className="text-rose-500 font-black">{viewingReceipt.isSitting ? `-${viewingReceipt.transactionAmount} Sitting` : `-₹${Number(viewingReceipt.transactionAmount).toLocaleString()}`}</span>
                 </div>
                 <div className="flex justify-between text-sm font-black text-indigo-600 pt-2 border-t border-slate-200">
                    <span>CLOSING BALANCE:</span>
                    <span>{viewingReceipt.isSitting ? `${viewingReceipt.closingBalance} Sittings` : `₹${Number(viewingReceipt.closingBalance).toLocaleString()}`}</span>
                 </div>
              </div>

              <div className="text-center mt-8 space-y-2">
                 <p className="text-[10px] font-bold text-slate-400 italic">"Glow today, glow every day."</p>
                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">Thank you for your loyalty!</p>
              </div>
           </div>

           <div className="flex gap-4 mt-8">
              <button onClick={() => setViewingReceipt(null)} className="px-10 py-4 bg-white/10 text-white font-black uppercase text-xs rounded-2xl border border-white/20">Close</button>
              <button onClick={handleShareReceipt} className="px-12 py-4 bg-emerald-50 text-white font-black uppercase text-xs rounded-2xl shadow-xl flex items-center gap-2">
                 <span>{shareStatus === 'capturing' ? '⌛' : '📲'}</span>
                 {shareStatus === 'capturing' ? 'Capturing...' : shareStatus === 'copied' ? 'Link Sent!' : 'Share to WhatsApp'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};
