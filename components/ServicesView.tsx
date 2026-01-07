
import React, { useState, useRef, useEffect } from 'react';
import { dataService } from '../services/mockData';
import { Card } from './common/Card';
import { Service } from '../types';

export const ServicesView: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Omit<Service, 'id'>>({
    name: '',
    category: 'Hair',
    basePrice: 0
  });

  const loadServices = async () => {
    const list = await dataService.getServices();
    setServices(list);
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleOpenModal = (svc?: Service) => {
    if (svc) {
      setEditingService(svc);
      setFormData({ name: svc.name, category: svc.category, basePrice: svc.basePrice });
    } else {
      setEditingService(null);
      setFormData({ name: '', category: 'Hair', basePrice: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      await dataService.updateService({ ...formData, id: editingService.id });
    } else {
      await dataService.addService(formData);
    }
    await loadServices();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this service from the database?')) {
      await dataService.deleteService(id);
      await loadServices();
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n');
      const newServices: Omit<Service, 'id'>[] = [];
      
      rows.slice(1).forEach(row => {
        const columns = row.split(',').map(c => c.trim());
        if (columns.length >= 3) {
          const [name, category, price] = columns;
          if (name && category && !isNaN(parseFloat(price))) {
            newServices.push({
              name,
              category: category as any,
              basePrice: parseFloat(price)
            });
          }
        }
      });

      if (newServices.length > 0) {
        for (const s of newServices) {
          await dataService.addService(s);
        }
        await loadServices();
        alert(`Successfully imported ${newServices.length} services.`);
      } else {
        alert("No valid services found in CSV. Please ensure the format is: Name, Category, Price");
      }
      setIsImportModalOpen(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Service Database</h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Manage standard pricing and categories</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <span>📥</span> Bulk Import (Excel)
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="px-8 py-3 bg-[#7C3AED] text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-purple-100 transition-all hover:scale-[1.02] flex items-center gap-2"
          >
            <span>+</span> New Service
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['Hair', 'Skin', 'Spa', 'Nails'].map(cat => (
          <Card key={cat} className="p-4 border-none shadow-xl rounded-[1.5rem] bg-white flex flex-col justify-between h-24 relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{cat} Services</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                {services.filter(s => s.category === cat).length}
              </h2>
            </div>
            <div className="absolute -bottom-2 -right-2 text-4xl opacity-5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
              {cat === 'Hair' ? '✂️' : cat === 'Skin' ? '✨' : cat === 'Spa' ? '🛁' : '💅'}
            </div>
          </Card>
        ))}
      </div>

      <Card title="Master Service List" className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Name</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Standard Price</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {services.length > 0 ? services.map(svc => (
                <tr key={svc.id} className="hover:bg-slate-50/30 transition duration-300 group">
                  <td className="px-8 py-5">
                    <span className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{svc.name}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100/50">
                      {svc.category}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-slate-700 text-sm">₹{svc.basePrice.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(svc)} className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-indigo-50 text-indigo-400 rounded-xl transition shadow-sm border border-transparent hover:border-indigo-100">✏️</button>
                      <button onClick={() => handleDelete(svc.id)} className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-rose-400 rounded-xl transition shadow-sm border border-transparent hover:border-rose-100">🗑️</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <div className="text-4xl mb-4 grayscale opacity-30">📋</div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-300">No services found in database</p>
                    <button onClick={() => handleOpenModal()} className="mt-4 text-indigo-600 font-bold text-xs hover:underline uppercase tracking-widest">Create First Entry</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* NEW SERVICE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative animate-in zoom-in duration-300 border border-slate-100">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-10 right-10 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-full"
            >
              <span className="text-2xl">✕</span>
            </button>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
              {editingService ? 'Update Service' : 'New Service'}
            </h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-10 pb-6 border-b border-slate-50">Configure global service definition</p>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Service Name *</label>
                <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Luxury Hair Spa" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
                  <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none cursor-pointer appearance-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                    <option value="Hair">Hair</option>
                    <option value="Skin">Skin</option>
                    <option value="Spa">Spa</option>
                    <option value="Nails">Nails</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Base Price (₹) *</label>
                  <input required type="number" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 transition-all" value={formData.basePrice || ''} onChange={e => setFormData({...formData, basePrice: parseFloat(e.target.value) || 0})} placeholder="0.00" />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black uppercase text-[11px] tracking-widest">Discard</button>
                <button type="submit" className="flex-[2] py-5 bg-[#7C3AED] text-white font-black rounded-[1.5rem] uppercase tracking-widest text-[11px] shadow-2xl shadow-purple-200 active:scale-95 transition-all">Save to Directory</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-12 shadow-2xl relative animate-in zoom-in duration-300 border border-slate-100">
            <button 
              onClick={() => setIsImportModalOpen(false)} 
              className="absolute top-10 right-10 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-full"
            >
              <span className="text-2xl">✕</span>
            </button>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Bulk Import Services</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-10 pb-6 border-b border-slate-50">Upload Excel/CSV file to populate directory</p>
            
            <div className="bg-indigo-50 p-6 rounded-3xl mb-8 border border-indigo-100 border-dashed">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3">Required Format (CSV)</h4>
              <p className="text-xs font-bold text-slate-600 leading-relaxed">
                Save your Excel sheet as CSV with these columns:<br/>
                <code className="bg-white px-2 py-1 rounded text-indigo-500 mt-2 inline-block font-black">Name, Category, Price</code>
              </p>
              <p className="text-[10px] text-indigo-400 mt-4 font-bold italic">Example: Hair Cut, Hair, 450</p>
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
                 <div className="w-16 h-16 bg-slate-50 text-indigo-400 flex items-center justify-center rounded-2xl text-2xl group-hover:bg-indigo-50 transition-colors">📁</div>
                 <div className="text-center">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Select CSV File</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Excel-exported comma separated values</p>
                 </div>
               </button>
               
               <button 
                onClick={() => setIsImportModalOpen(false)}
                className="w-full py-4 text-slate-400 font-black uppercase text-[11px] tracking-widest"
               >
                 Cancel Import
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
