
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/mockData';
import { Card } from './common/Card';
import { Staff, Salon } from '../types';

export const PayrollView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isProcessing, setIsProcessing] = useState(false);
  const [payrollStatus, setPayrollStatus] = useState<'pending' | 'completed'>('pending');
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [payrollItems, setPayrollItems] = useState<any[]>([]);
  // Fix: Move activeSalon to state to handle async fetch
  const [activeSalon, setActiveSalon] = useState<Salon | undefined>(undefined);

  const salonId = dataService.getActiveSalonId();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    const loadPayroll = async () => {
      // Fix: Await active salon data along with staff list
      const [allStaff, salon] = await Promise.all([
        dataService.getStaff(salonId || undefined),
        dataService.getActiveSalon()
      ]);
      setStaffList(allStaff);
      setActiveSalon(salon);

      const items = await Promise.all(allStaff.map(async (s) => {
        const stats = await dataService.getMonthlyAttendanceStats(s.id, selectedMonth, selectedYear);
        const base = s.salary || 0;
        const daily = base / 30;
        const deductions = stats.effectiveDeductionDays * daily;
        const otPay = stats.extraHours * (daily / 8);
        
        const actualSales = await dataService.calculateStaffSales(s.id, selectedMonth, selectedYear);
        const target = s.target || 0;
        const incentive = s.role === 'Staff' ? Math.max(0, (actualSales - target) * 0.10) : 0;
        
        const netPayout = Math.max(0, base - deductions + otPay + incentive);
        const targetAchievement = target > 0 ? (actualSales / target) * 100 : 0;

        return {
          ...s,
          stats,
          actualSales,
          target,
          incentive,
          otPay,
          deductions,
          netPayout,
          targetAchievement
        };
      }));
      setPayrollItems(items);
    };
    loadPayroll();
  }, [selectedMonth, selectedYear, salonId]);

  const totalLiability = payrollItems.reduce((acc, item) => acc + item.netPayout, 0);
  const totalIncentives = payrollItems.reduce((acc, item) => acc + item.incentive, 0);
  const totalOt = payrollItems.reduce((acc, item) => acc + item.otPay, 0);

  const handleRunPayroll = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const header = "Staff Name, Role, Base Salary, Days Present, LOP Days, Sales Target, Actual Sales, Incentives, OT Pay, Net Payout\n";
      const body = payrollItems.map(p => 
        `${p.name}, ${p.role}, ${p.salary}, ${p.stats.present}, ${p.stats.lopDays}, ${p.target}, ${p.actualSales.toFixed(0)}, ${p.incentive.toFixed(0)}, ${p.otPay.toFixed(0)}, ${p.netPayout.toFixed(0)}`
      ).join('\n');
      
      const blob = new Blob([header + body], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Fix: activeSalon is now state and its properties can be accessed directly
      link.download = `Payroll_${activeSalon?.name || 'Outlet'}_${months[selectedMonth]}_${selectedYear}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
      setIsProcessing(false);
      setPayrollStatus('completed');
    }, 1500);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Payroll Execution</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-1">Monthly settlement & performance audit</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest outline-none"
            value={selectedMonth}
            onChange={e => setSelectedMonth(parseInt(e.target.value))}
          >
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select 
            className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest outline-none"
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
          >
            <option value={2023}>2023</option>
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
          <button 
            onClick={handleRunPayroll}
            disabled={isProcessing}
            className={`px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center gap-3 ${
              payrollStatus === 'completed' ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isProcessing ? '⏳ Calculating...' : payrollStatus === 'completed' ? '✓ Payroll Disbursed' : '🏦 Process Payroll'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="bg-white border-none shadow-xl rounded-[2.5rem] p-8 flex flex-col justify-between h-36">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Disbursement</p>
           <h2 className="text-4xl font-black text-slate-900 tracking-tighter">₹{totalLiability.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h2>
           <p className="text-indigo-600 font-bold text-[9px] uppercase tracking-widest">Net Payable liability</p>
        </Card>
        <Card className="bg-white border-none shadow-xl rounded-[2.5rem] p-8 flex flex-col justify-between h-36">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bonus & OT Burn</p>
           <h2 className="text-4xl font-black text-emerald-500 tracking-tighter">₹{(totalIncentives + totalOt).toLocaleString(undefined, { maximumFractionDigits: 0 })}</h2>
           <p className="text-emerald-600 font-bold text-[9px] uppercase tracking-widest">Performance-based payload</p>
        </Card>
        <Card className="bg-[#1E293B] border-none shadow-2xl rounded-[2.5rem] p-8 flex flex-col justify-between h-36 text-white">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Outlet Staffing Level</p>
           <h2 className="text-4xl font-black text-indigo-400 tracking-tighter">{staffList.length} <span className="text-xl opacity-50 font-black uppercase text-[12px] tracking-widest">Members</span></h2>
           <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">Current Active Registry</p>
        </Card>
      </div>

      <Card title="Personnel Settlement Ledger" className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member / Target</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Base Pay</th>
                <th className="px-10 py-8 text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center">Bonuses</th>
                <th className="px-10 py-8 text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">Deductions</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">Net Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payrollItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/20 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-indigo-600 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {item.name.charAt(0)}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-black text-slate-900">{item.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{item.role}</p>
                        </div>
                        {item.role === 'Staff' && (
                          <div className="w-32">
                            <div className="flex justify-between items-center mb-1">
                               <span className="text-[8px] font-black text-slate-400 uppercase">Sales Goal</span>
                               <span className="text-[8px] font-black text-indigo-500">{Math.round(item.targetAchievement)}%</span>
                            </div>
                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-700 ${item.targetAchievement >= 100 ? 'bg-emerald-400' : 'bg-indigo-500'}`} 
                                style={{ width: `${Math.min(100, item.targetAchievement)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className="text-sm font-black text-slate-600">₹{item.salary?.toLocaleString()}</span>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <div className="flex flex-col">
                       <span className="text-sm font-black text-emerald-600">+₹{(item.incentive + item.otPay).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                       <span className="text-[8px] font-bold text-emerald-300 uppercase">Inc: ₹{item.incentive.toFixed(0)} | OT: ₹{item.otPay.toFixed(0)}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <div className="flex flex-col">
                       <span className="text-sm font-black text-rose-500">-₹{item.deductions.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                       <span className="text-[8px] font-bold text-rose-300 uppercase">{item.stats.lopDays} LOP Days</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="text-xl font-black text-slate-900 tracking-tight">₹{item.netPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-0.5 animate-pulse">Pending Review</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="bg-[#0F172A] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-xl">
             <h4 className="text-2xl font-black uppercase tracking-tight mb-4">Payout Protocol Summary</h4>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">01</div>
                  <p className="text-xs text-slate-400 leading-relaxed"><span className="text-white font-bold">Incentives:</span> Automatically computed at <span className="text-emerald-400 font-bold">10% of surplus sales</span> above the 5x salary target.</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">02</div>
                  <p className="text-xs text-slate-400 leading-relaxed"><span className="text-white font-bold">Overtime:</span> Calculated hourly based on actual timing logs exceeding shifts.</p>
                </div>
             </div>
          </div>
          <div className="flex flex-col items-center p-8 bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-xl">
             <div className="text-5xl mb-4">🖨️</div>
             <p className="text-xs font-black uppercase tracking-widest">Monthly Reports</p>
             <p className="text-[10px] text-slate-500 mt-2 text-center">Generated CSV includes full<br/>audit logs for each staff member.</p>
          </div>
        </div>
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};
