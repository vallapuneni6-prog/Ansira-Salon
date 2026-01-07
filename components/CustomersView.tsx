import React, { useState, useRef } from 'react';
import { dataService } from '../services/mockData';
import { Card } from './common/Card';
import { Customer } from '../types';

export const CustomersView: React.FC = () => {
  const [customers, setCustomers] = useState(dataService.getCustomers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Customer>({
    name: '',
    mobile: ''
  });

  const handleOpenModal = () => {
    setFormData({ name: '', mobile: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mobile || !formData.name) return;
    dataService.saveCustomer(formData);
    setCustomers([...dataService.getCustomers()]);
    setIsModalOpen(false);
  };

  const handleDelete = (mobile: string) => {
    if (window.confirm('Erase this customer record from the master list?')) {
      dataService.deleteCustomer(mobile);
      setCustomers([...dataService.getCustomers()]);
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n');
      const newCustomers: Customer[] = [];
      
      rows.slice(1).forEach(row => {
        const columns = row.split(',').map(c => c.trim());
        if (columns.length >= 2) {
          const [name, mobile] = columns;
          if (name && mobile && mobile.length >= 10) {
            newCustomers.push({ name, mobile });
          }
        }
      });

      if (newCustomers.length > 0) {
        dataService.bulkAddCustomers(newCustomers);
        setCustomers([...dataService.getCustomers()]);
        alert(`Successfully synchronized ${newCustomers.length} client records.`);
      } else {
        alert("Parsing Error: No valid client records found. Ensure CSV format is 'Name, Mobile'");
      }
      setIsImportModalOpen(false);
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    if (customers.length === 0) return;
    const header = "Name, Mobile\n";
    const body = customers.map(c => `${c.name}, ${c.mobile}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Luxe_Customers_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Customer Relationship Management</h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Centralized client database & engagement history</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleExportCSV}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <span>📤</span> Export CSV
          </button>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <span>📥</span> Bulk Sync
          </button>
          <button 
            onClick={handleOpenModal}
            className="px-8 py-3 bg-[#7C3AED] text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-purple-100 transition-all hover:scale-[1.02] flex items-center gap-2"
          >
            <span>+</span> Manual Entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-xl rounded-[2rem] bg-white flex flex-col justify-between h-32">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Reach</p>
           <h2 className="text-4xl font-black text-slate-900">{customers.length}</h2>
           <p className="text-indigo-500 font-bold text-[9px] uppercase tracking-tighter">Unique Mobile IDs Tracked</p>
        </Card>
        <Card className="p-6 border-none shadow-xl rounded-[2rem] bg-indigo-600 flex flex-col justify-between h-32 text-white">
           <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Active Retention</p>
           <h2 className="text-4xl font-black text-white">84%</h2>
           <p className="text-indigo-200 font-bold text-[9px] uppercase tracking-tighter">Month-on-Month Retention</p>
        </Card>
        <Card className="p-6 border-none shadow-xl rounded-[2rem] bg-[#1E293B] flex flex-col justify-between h-32 text-white">
           <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">New Acquisitions</p>
           <h2 className="text-4xl font-black text-emerald-400">+{Math.floor(customers.length * 0.12)}</h2>
           <p className="text-slate-400 font-bold text-[9px] uppercase tracking-tighter">Discovery Rate this cycle</p>
        </Card>
      </div>

      <Card title="Master Client Registry" className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Identity</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Verified</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Relationship Score</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {customers.length > 0 ? customers.map(c => (
                <tr key={c.mobile} className="hover:bg-slate-50/30 transition duration-300 group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-inner">
                         {c.name.charAt(0)}
                       </div>
                       <span className="text-sm font-black text-slate-900 group-hover:translate-x-1 transition-transform">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-0.5">
                       <span className="text-sm font-bold text-slate-600">📲 {c.mobile}</span>
                       <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">✓ WhatsApp Enabled</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex flex-col items-end gap-1">
                       <div className="flex gap-0.5">
                         {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 rounded-full bg-amber-400"></div>)}
                         <div className="w-2 h-2 rounded-full bg-slate-100"></div>
                       </div>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Loyal Tier</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => handleDelete(c.mobile)} className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-rose-300 hover:text-rose-500 rounded-xl transition shadow-sm border border-transparent hover:border-rose-100">🗑️</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <div className="text-4xl mb-4 grayscale opacity-30">👥</div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-300">No client profiles discovered yet</p>
                    <button onClick={handleOpenModal} className="mt-4 text-indigo-600 font-bold text-xs hover:underline uppercase tracking-widest">Manual Provisioning</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative animate-in zoom-in duration-300 border border-slate-100">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-10 right-10 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-full"
            >
              <span className="text-2xl">✕</span>
            </button>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">New Client Profile</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-10 pb-6 border-b border-slate-50">Create persistent identity record</p>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Legal Name *</label>
                <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Tony Stark" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mobile Primary *</label>
                <input required type="tel" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 transition-all" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="10-digit primary contact" />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black uppercase text-[11px] tracking-widest">Discard</button>
                <button type="submit" className="flex-[2] py-5 bg-[#7C3AED] text-white font-black rounded-[1.5rem] uppercase tracking-widest text-[11px] shadow-2xl shadow-purple-200 active:scale-95 transition-all">Onboard Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-12 shadow-2xl relative animate-in zoom-in duration-300 border border-slate-100">
            <button 
              onClick={() => setIsImportModalOpen(false)} 
              className="absolute top-10 right-10 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-full"
            >
              <span className="text-2xl">✕</span>
            </button>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Bulk Client Ingestion</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-10 pb-6 border-b border-slate-50">Upload CRM data to synchronize records</p>
            
            <div className="bg-indigo-50 p-6 rounded-3xl mb-8 border border-indigo-100 border-dashed">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3">Ingestion Protocol (CSV)</h4>
              <p className="text-xs font-bold text-slate-600 leading-relaxed">
                Source file must contain exactly these columns:<br/>
                <code className="bg-white px-2 py-1 rounded text-indigo-500 mt-2 inline-block font-black">Name, Mobile</code>
              </p>
              <p className="text-[10px] text-indigo-400 mt-4 font-bold italic">Duplicates will be updated with latest identity info.</p>
            </div>

            <div className="space-y-6">
               <input 
                 type="file" 
                 ref={fileInputRef}
                 accept=".csv"
                 onChange={handleImportCSV}
                 className="hidden"
               />
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="w-full py-12 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-4 hover:border-indigo-400 hover:bg-slate-50 transition-all group"
               >
                 <div className="w-16 h-16 bg-slate-50 text-indigo-400 flex items-center justify-center rounded-2xl text-2xl group-hover:bg-indigo-50 transition-colors">📂</div>
                 <div className="text-center">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Select CRM Export</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Comma separated values only</p>
                 </div>
               </button>
               
               <button 
                onClick={() => setIsImportModalOpen(false)}
                className="w-full py-4 text-slate-400 font-black uppercase text-[11px] tracking-widest"
               >
                 Abort Migration
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};