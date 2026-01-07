
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/mockData';
import { Card } from './common/Card';
import { UserRole, Salon } from '../types';

interface SalonsViewProps {
  onManage: (salonId: string) => void;
}

export const SalonsView: React.FC<SalonsViewProps> = ({ onManage }) => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSalonId, setEditingSalonId] = useState<string | null>(null);

  const currentUser = dataService.getCurrentUser();
  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact: '',
    gstNumber: '',
    managerName: ''
  });

  const loadSalons = async () => {
    const list = await dataService.getSalons();
    setSalons(list);
  };

  useEffect(() => {
    loadSalons();
  }, []);

  const colorVariants = [
    { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', iconBg: 'bg-indigo-100', status: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', iconBg: 'bg-emerald-100', status: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', iconBg: 'bg-amber-100', status: 'bg-amber-50 text-amber-600 border-amber-100' },
    { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', iconBg: 'bg-rose-100', status: 'bg-rose-50 text-rose-600 border-rose-100' },
    { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100', iconBg: 'bg-cyan-100', status: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
    { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', iconBg: 'bg-violet-100', status: 'bg-violet-50 text-violet-600 border-violet-100' },
  ];

  const openAddModal = () => {
    setEditingSalonId(null);
    setFormData({ name: '', address: '', contact: '', gstNumber: '', managerName: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, salon: Salon) => {
    e.stopPropagation();
    setEditingSalonId(salon.id);
    setFormData({
      name: salon.name,
      address: salon.address,
      contact: salon.contact,
      gstNumber: salon.gstNumber || '',
      managerName: salon.managerName || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSalonId) {
      await dataService.updateSalon(editingSalonId, {
        name: formData.name,
        address: formData.address,
        contact: formData.contact,
        gstNumber: formData.gstNumber,
        managerName: formData.managerName
      });
    } else {
      await dataService.onboardSalon(
        { name: formData.name, address: formData.address, contact: formData.contact, gstNumber: formData.gstNumber },
        formData.managerName
      );
    }
    await loadSalons();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Managed Outlets</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Select a site to initiate regional management</p>
        </div>
        {isSuperAdmin && (
          <button 
            onClick={openAddModal}
            className="px-6 py-3 bg-[#1E293B] text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-xl transition-all hover:bg-black active:scale-95 flex items-center gap-2"
          >
            <span>+</span> Add New Salon
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {salons.map((salon, index) => {
          const variant = colorVariants[index % colorVariants.length];
          return (
            <div 
              key={salon.id} 
              onClick={() => onManage(salon.id)}
              className="group cursor-pointer transform hover:scale-[1.03] transition-all duration-300"
            >
              <Card className={`hover:shadow-xl ${variant.bg} border-none shadow-sm relative overflow-hidden h-full rounded-[2rem] p-0`}>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className={`w-10 h-10 ${variant.iconBg} rounded-xl flex items-center justify-center ${variant.text} shadow-inner`}>
                      <span className="text-lg">📍</span>
                    </div>
                    {isSuperAdmin && (
                      <button 
                        onClick={(e) => openEditModal(e, salon)}
                        className="p-2 text-slate-400 hover:text-slate-600 transition-all rounded-lg hover:bg-white/50"
                      >
                        <span className="text-xs font-black">EDIT</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className={`text-base font-black ${variant.text} uppercase tracking-tight leading-tight group-hover:scale-[1.02] transition-transform origin-left`}>
                      {salon.name}
                    </h3>
                    <div className="pt-1">
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest opacity-60">Manager</p>
                      <p className="text-[11px] font-black text-slate-800 uppercase truncate">
                        {salon.managerName || 'Admin'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-900/5 flex items-center justify-between">
                    <span className={`px-2 py-1 ${variant.status} rounded-lg text-[8px] font-black uppercase tracking-widest border`}>
                      Live
                    </span>
                    <span className={`text-[9px] font-black ${variant.text} uppercase tracking-widest group-hover:translate-x-1 transition-transform`}>
                      Manage →
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative border border-slate-100 animate-in zoom-in duration-300">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-10 right-10 w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-full"
            >
              <span className="text-2xl">✕</span>
            </button>
            
            <h2 className="text-3xl font-black text-[#0F172A] mb-2 tracking-tighter uppercase">
              {editingSalonId ? 'Modify Outlet' : 'Onboard Outlet'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-8 mt-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Salon Name *</label>
                  <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold text-slate-800 transition-all" placeholder="e.g. Royal Bliss" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Verified Contact *</label>
                  <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold text-slate-800 transition-all" placeholder="e.g. 555-0199" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Address *</label>
                  <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold text-slate-800 transition-all" placeholder="e.g. 789 Park Lane, North End" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">GST Number</label>
                  <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold text-slate-800 transition-all" placeholder="e.g. 36GST3456THD" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assigned Manager Name</label>
                  <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold text-slate-800 transition-all" placeholder="Michael Scott" value={formData.managerName} onChange={e => setFormData({...formData, managerName: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-[2] py-5 bg-[#0F172A] text-white font-black rounded-3xl uppercase tracking-widest text-[11px] shadow-2xl hover:bg-black active:scale-95 transition-all">
                  {editingSalonId ? 'Update Site' : 'Complete Onboarding'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black rounded-3xl uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all">
                  Discard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
