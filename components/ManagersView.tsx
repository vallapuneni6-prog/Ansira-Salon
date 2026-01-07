import React, { useState } from 'react';
import { dataService } from '../services/mockData';
import { Card } from './common/Card';
import { User, UserRole } from '../types';

export const ManagersView: React.FC = () => {
  const [managers, setManagers] = useState(dataService.getManagers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMgrId, setEditingMgrId] = useState<string | null>(null);
  const salons = dataService.getSalons();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    salonId: ''
  });

  const openAddModal = () => {
    setEditingMgrId(null);
    setFormData({ name: '', username: '', password: '', salonId: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (mgr: User) => {
    setEditingMgrId(mgr.id);
    setFormData({
      name: mgr.name,
      username: mgr.username,
      password: '', 
      salonId: mgr.salonIds?.[0] || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.salonId) {
      alert("A manager must be assigned to exactly one outlet.");
      return;
    }

    if (editingMgrId) {
      const updateData: Partial<User> = {
        name: formData.name,
        username: formData.username,
        salonIds: [formData.salonId]
      };
      if (formData.password) updateData.password = formData.password;
      dataService.updateUser(editingMgrId, updateData);
    } else {
      dataService.addManager({
        name: formData.name,
        username: formData.username,
        password: formData.password || '123',
        role: UserRole.MANAGER,
        salonIds: [formData.salonId]
      });
    }
    setManagers(dataService.getManagers());
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Terminate access for this Outlet Manager?')) {
      dataService.deleteUser(id);
      setManagers(dataService.getManagers());
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Outlet Managers</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.25em] mt-1">Personnel responsible for daily floor operations</p>
        </div>
        <button 
          onClick={openAddModal}
          className="px-10 py-5 bg-[#1E293B] text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-2xl transition-all hover:bg-black active:scale-95 flex items-center gap-3"
        >
          <span className="text-lg">👤</span>
          Add New Manager
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {managers.length > 0 ? (
          <Card className="border-none shadow-xl rounded-[2.5rem] p-0 overflow-hidden bg-white">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Manager Profile</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Single Salon Authority</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {managers.map(mgr => {
                  const salon = salons.find(s => s.id === mgr.salonIds?.[0]);
                  return (
                    <tr key={mgr.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl shadow-inner">
                            {mgr.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-lg font-black text-slate-900">{mgr.name}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">@{mgr.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        {salon ? (
                           <div className="flex items-center gap-3">
                             <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                             <span className="text-[11px] font-black text-indigo-600 uppercase tracking-tight">
                               {salon.name}
                             </span>
                           </div>
                        ) : (
                          <span className="text-xs text-rose-300 italic font-medium">Unassigned (Orphan Account)</span>
                        )}
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex justify-end gap-3">
                          <button 
                            onClick={() => openEditModal(mgr)}
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                          >
                            Modify Account
                          </button>
                          <button 
                            onClick={() => handleDelete(mgr.id)}
                            className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-sm">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl mb-8 grayscale opacity-20">👤</div>
             <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No Outlet Managers Found</p>
             <button onClick={openAddModal} className="mt-4 text-indigo-600 font-black text-sm hover:underline uppercase tracking-widest">Create Manager Account</button>
          </div>
        )}
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
              {editingMgrId ? 'Update Manager' : 'Provision Manager'}
            </h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-10 pb-6 border-b border-slate-50">Assign manager to a specific outlet</p>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Legal Name *</label>
                  <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold text-slate-800 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Michael Scott" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username *</label>
                  <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold text-slate-800 transition-all" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="e.g. manager_downtown" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{editingMgrId ? 'Change Password (Optional)' : 'Security Password *'}</label>
                  <input type="password" required={!editingMgrId} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold text-slate-800 transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Assign Single Outlet</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {salons.map(salon => (
                    <button
                      key={salon.id}
                      type="button"
                      onClick={() => setFormData({...formData, salonId: salon.id})}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        formData.salonId === salon.id
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                          : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'
                      }`}
                    >
                      <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-tight">{salon.name}</p>
                        <p className={`text-[8px] font-bold ${formData.salonId === salon.id ? 'text-indigo-200' : 'text-slate-400'}`}>ID: {salon.id}</p>
                      </div>
                      <span className="text-xs">{formData.salonId === salon.id ? '✓' : '+'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-[2] py-5 bg-[#0F172A] text-white font-black rounded-3xl uppercase tracking-widest text-[11px] shadow-2xl hover:bg-black active:scale-95 transition-all">
                  {editingMgrId ? 'Commit Update' : 'Provision Manager'}
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