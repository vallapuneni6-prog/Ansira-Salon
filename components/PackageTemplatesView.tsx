
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/mockData';
import { Card } from './common/Card';
import { PackageTemplate, SittingPackageTemplate, Salon } from '../types';

export const PackageTemplatesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'value' | 'sitting'>('value');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [salons, setSalons] = useState<Salon[]>([]);
  const [valueTemplates, setValueTemplates] = useState<PackageTemplate[]>([]);
  const [sittingTemplates, setSittingTemplates] = useState<SittingPackageTemplate[]>([]);

  const [valueForm, setValueForm] = useState({
    name: '',
    paidAmount: 0,
    offeredValue: 0,
    salonIds: [] as string[]
  });

  const [sittingForm, setSittingForm] = useState({
    name: '',
    paidSittings: 0,
    compSittings: 0,
    salonIds: [] as string[]
  });

  const loadData = async () => {
    setLoading(true);
    const [salonList, valTmpls, sitTmpls] = await Promise.all([
      dataService.getSalons(),
      dataService.getPackageTemplates(),
      dataService.getSittingPackageTemplates()
    ]);
    setSalons(salonList);
    setValueTemplates(valTmpls);
    setSittingTemplates(sitTmpls);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleValueSalon = (id: string) => {
    setValueForm(prev => ({
      ...prev,
      salonIds: prev.salonIds.includes(id) 
        ? prev.salonIds.filter(sid => sid !== id) 
        : [...prev.salonIds, id]
    }));
  };

  const handleToggleSittingSalon = (id: string) => {
    setSittingForm(prev => ({
      ...prev,
      salonIds: prev.salonIds.includes(id) 
        ? prev.salonIds.filter(sid => sid !== id) 
        : [...prev.salonIds, id]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'value') {
      if (!valueForm.name || valueForm.salonIds.length === 0) return;
      await dataService.addPackageTemplate(valueForm);
    } else {
      if (!sittingForm.name || sittingForm.salonIds.length === 0) return;
      await dataService.addSittingPackageTemplate({
        ...sittingForm,
        totalSittings: sittingForm.paidSittings + sittingForm.compSittings
      });
    }
    await loadData();
    setIsModalOpen(false);
    resetForms();
  };

  const resetForms = () => {
    setValueForm({ name: '', paidAmount: 0, offeredValue: 0, salonIds: [] });
    setSittingForm({ name: '', paidSittings: 0, compSittings: 0, salonIds: [] });
  };

  const handleDeleteValue = async (id: string) => {
    if (window.confirm('Delete this template? Existing subscriptions won\'t be affected.')) {
      await dataService.deletePackageTemplate(id);
      await loadData();
    }
  };

  const handleDeleteSitting = async (id: string) => {
    if (window.confirm('Delete this bundle template?')) {
      await dataService.deleteSittingPackageTemplate(id);
      await loadData();
    }
  };

  if (loading) {
    return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest">Synchronizing Blueprints...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Package Blueprinting</h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Design promotional templates for assigned outlets</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            <button 
              onClick={() => setActiveTab('value')}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'value' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Wallet Templates
            </button>
            <button 
              onClick={() => setActiveTab('sitting')}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'sitting' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Bundle Templates
            </button>
          </div>
          <button 
            onClick={() => { resetForms(); setIsModalOpen(true); }}
            className="px-8 py-3 bg-[#1E293B] text-white font-black uppercase text-[10px] tracking-widest rounded-[1.5rem] shadow-2xl transition active:scale-95"
          >
            + Create Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'value' ? (
          valueTemplates.map(t => (
            <Card key={t.id} className="border-none shadow-xl rounded-[2.5rem] p-8 group hover:shadow-2xl transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-2xl text-xl">💳</div>
                <button onClick={() => handleDeleteValue(t.id)} className="p-2 text-slate-300 hover:text-rose-500 transition">🗑️</button>
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-tight mb-2">{t.name}</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-2xl font-black text-indigo-600">₹{t.offeredValue.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Value for ₹{t.paidAmount.toLocaleString()}</span>
              </div>
              <div className="pt-6 border-t border-slate-50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Live in {t.salonIds.length} Outlets</p>
                <div className="flex flex-wrap gap-1.5">
                  {t.salonIds.map(sid => (
                    <span key={sid} className="px-2 py-1 bg-slate-50 rounded-lg text-[8px] font-black text-slate-500 uppercase">{salons.find(s => s.id === sid)?.name.split(' ').pop()}</span>
                  ))}
                </div>
              </div>
            </Card>
          ))
        ) : (
          sittingTemplates.map(t => (
            <Card key={t.id} className="border-none shadow-xl rounded-[2.5rem] p-8 group hover:shadow-2xl transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-2xl text-xl">✨</div>
                <button onClick={() => handleDeleteSitting(t.id)} className="p-2 text-slate-300 hover:text-rose-500 transition">🗑️</button>
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-tight mb-2">{t.name}</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-2xl font-black text-emerald-600">{t.totalSittings} Sittings</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">({t.paidSittings} + {t.compSittings} Free)</span>
              </div>
              <div className="pt-6 border-t border-slate-50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Available at {t.salonIds.length} Sites</p>
                <div className="flex flex-wrap gap-1.5">
                  {t.salonIds.map(sid => (
                    <span key={sid} className="px-2 py-1 bg-slate-50 rounded-lg text-[8px] font-black text-slate-500 uppercase">{salons.find(s => s.id === sid)?.name.split(' ').pop()}</span>
                  ))}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative border border-slate-100 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-10 right-10 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-full"
            >
              <span className="text-2xl">✕</span>
            </button>
            
            <h2 className="text-3xl font-black text-[#0F172A] mb-10 tracking-tight uppercase">
              New {activeTab === 'value' ? 'Wallet' : 'Bundle'} Template
            </h2>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Template Name *</label>
                <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none" value={activeTab === 'value' ? valueForm.name : sittingForm.name} onChange={e => activeTab === 'value' ? setValueForm({...valueForm, name: e.target.value}) : setSittingForm({...sittingForm, name: e.target.value})} placeholder="e.g. Anniversary Platinum Wallet" />
              </div>

              {activeTab === 'value' ? (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Paid Amount (₹)</label>
                    <input type="number" required className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold" value={valueForm.paidAmount || ''} onChange={e => setValueForm({...valueForm, paidAmount: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1">Offered Value (₹)</label>
                    <input type="number" required className="w-full px-6 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl font-black text-indigo-600" value={valueForm.offeredValue || ''} onChange={e => setValueForm({...valueForm, offeredValue: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Paid Sittings</label>
                    <input type="number" required className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold" value={sittingForm.paidSittings || ''} onChange={e => setSittingForm({...sittingForm, paidSittings: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Comp Sittings</label>
                    <input type="number" required className="w-full px-6 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl font-black text-emerald-600" value={sittingForm.compSittings || ''} onChange={e => setSittingForm({...sittingForm, compSittings: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Apply to Outlets *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {salons.map(s => (
                    <button 
                      key={s.id}
                      type="button"
                      onClick={() => activeTab === 'value' ? handleToggleValueSalon(s.id) : handleToggleSittingSalon(s.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        (activeTab === 'value' ? valueForm.salonIds : sittingForm.salonIds).includes(s.id)
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                        : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-100'
                      }`}
                    >
                      <span className="text-xs font-black uppercase tracking-tight">{s.name}</span>
                      <span className="text-xs">{(activeTab === 'value' ? valueForm.salonIds : sittingForm.salonIds).includes(s.id) ? '✓' : '+'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-[2] py-5 bg-[#0F172A] text-white font-black rounded-3xl uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all">Publish Template</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black rounded-3xl uppercase tracking-widest text-[11px]">Discard</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
