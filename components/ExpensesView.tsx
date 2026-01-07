
import React, { useState, useEffect } from 'react';
import { Card } from './common/Card';
import { dataService } from '../services/mockData';
import { Expense } from '../types';

export const ExpensesView: React.FC = () => {
  const salonId = dataService.getActiveSalonId();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    openingBalance: 0,
    cashReceived: 0,
    category: '',
    expenseAmount: 0,
    cashDeposited: 0
  });

  const categories = [
    'Milk / Tea Powder / Sugar',
    'Customer Refreshments',
    'Water Bottles for Customers',
    'Watercans for Staff',
    'Housekeeping Supplies',
    'Staff Tips',
    'Staff Advance',
    'Diesel',
    'Maintenance/Repairs',
    'Transportation',
    'Festival donation',
    'Others'
  ];

  const refreshData = async () => {
    const list = await dataService.getExpenses(salonId || undefined);
    setExpenses(list);
  };

  useEffect(() => {
    refreshData();
  }, [salonId]);

  const handleOpenModal = async () => {
    const latest = await dataService.getLatestExpense(salonId);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      openingBalance: latest ? latest.closingBalance : 0,
      cashReceived: 0,
      category: '',
      expenseAmount: 0,
      cashDeposited: 0
    });
    setIsModalOpen(true);
  };

  const closingBalance = formData.openingBalance + formData.cashReceived - formData.expenseAmount - formData.cashDeposited;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      alert("Please select an expense category");
      return;
    }

    await dataService.addExpense({
      ...formData,
      salonId: salonId || 's1',
      closingBalance,
      recordedBy: dataService.getCurrentUser()?.name || 'System'
    });

    setIsModalOpen(false);
    await refreshData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Daily Cash Ledger</h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Operational Expenditures & Payouts</p>
        </div>
        <button 
          onClick={handleOpenModal}
          className="px-10 py-4 bg-[#7C3AED] text-white font-black uppercase text-xs rounded-[1.5rem] shadow-xl shadow-purple-100 transition-all hover:scale-[1.02] active:scale-95"
        >
          + Record Daily Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-xl rounded-[2rem] bg-white p-6 flex flex-col justify-between h-32">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Monthly Burn Rate</p>
           <h2 className="text-3xl font-black text-slate-900">₹{expenses.reduce((acc, e) => acc + e.expenseAmount, 0).toLocaleString()}</h2>
           <p className="text-rose-500 font-bold text-[10px] uppercase tracking-tighter">Total Monthly Outflow</p>
        </Card>
        <Card className="border-none shadow-xl rounded-[2rem] bg-white p-6 flex flex-col justify-between h-32">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deposited Cash</p>
           <h2 className="text-3xl font-black text-slate-900">₹{expenses.reduce((acc, e) => acc + e.cashDeposited, 0).toLocaleString()}</h2>
           <p className="text-emerald-500 font-bold text-[10px] uppercase tracking-tighter">Total Bank Transfers</p>
        </Card>
        <Card className="border-none shadow-xl rounded-[2rem] bg-[#1E293B] p-6 flex flex-col justify-between h-32 text-white">
           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">In-Store Liquidity</p>
           <h2 className="text-3xl font-black text-emerald-400">₹{(expenses[0]?.closingBalance || 0).toLocaleString()}</h2>
           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-tighter">Current Petty Cash Balance</p>
        </Card>
      </div>

      <Card title="Operational Expense Registry" className="border-none shadow-xl rounded-[2rem] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Date</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Details</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Debit (Exp)</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Banked</th>
                <th className="px-6 py-5 text-[10px] font-black text-indigo-600 uppercase tracking-widest text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {expenses.length > 0 ? expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="text-sm font-black text-slate-900">{new Date(exp.date).toLocaleDateString('en-GB')}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Recorded by {exp.recordedBy}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-black text-rose-500 text-sm">-₹{exp.expenseAmount.toLocaleString()}</td>
                  <td className="px-6 py-5 text-right font-black text-slate-400 text-sm">₹{exp.cashDeposited.toLocaleString()}</td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-sm font-black text-indigo-600">₹{exp.closingBalance.toLocaleString()}</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="text-4xl mb-4 grayscale opacity-50">💸</div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-300">No expense records found for this period</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-slate-100 animate-in zoom-in duration-300">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-full"
            >
              <span className="text-2xl">✕</span>
            </button>
            
            <div className="p-12">
              <h2 className="text-3xl font-black text-[#0F172A] mb-10 tracking-tight uppercase">Add Daily Expense</h2>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Expense Date *</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold text-slate-800 transition-all" 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Opening Balance (₹)</label>
                    <input 
                      readOnly 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-400 cursor-not-allowed shadow-inner" 
                      value={formData.openingBalance.toFixed(2)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Cash Received Today (₹)</label>
                    <input 
                      type="number" 
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold text-slate-800 transition-all shadow-sm" 
                      value={formData.cashReceived || ''} 
                      onChange={e => setFormData({...formData, cashReceived: parseFloat(e.target.value) || 0})} 
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Expense Category</label>
                  <select 
                    required 
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold text-slate-800 transition-all appearance-none cursor-pointer shadow-sm"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="">Select an expense category</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Expense Amount (₹)</label>
                    <input 
                      type="number" 
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold text-slate-800 transition-all shadow-sm" 
                      value={formData.expenseAmount || ''} 
                      onChange={e => setFormData({...formData, expenseAmount: parseFloat(e.target.value) || 0})} 
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Cash Deposited to Company Account (₹)</label>
                    <input 
                      type="number" 
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold text-slate-800 transition-all shadow-sm" 
                      value={formData.cashDeposited || ''} 
                      onChange={e => setFormData({...formData, cashDeposited: parseFloat(e.target.value) || 0})} 
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100 border-dashed space-y-2 shadow-inner">
                   <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Closing Balance (₹)</p>
                   <p className="text-5xl font-black text-indigo-600 tracking-tighter">₹{closingBalance.toLocaleString()}</p>
                   <p className="text-[10px] font-bold text-indigo-300 uppercase mt-2">
                     = {formData.openingBalance.toFixed(2)} + {formData.cashReceived.toFixed(2)} - {formData.expenseAmount.toFixed(2)} - {formData.cashDeposited.toFixed(2)}
                   </p>
                </div>

                <div className="flex gap-6 pt-6">
                  <button 
                    type="submit" 
                    className="flex-[2] py-6 bg-[#7C3AED] text-white font-black uppercase tracking-widest text-[13px] rounded-3xl shadow-xl shadow-purple-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                  >
                    Save Expense
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 py-6 bg-slate-100 text-slate-500 font-black uppercase tracking-widest text-[13px] rounded-3xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
