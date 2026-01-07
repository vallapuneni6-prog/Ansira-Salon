import React, { useState, useEffect } from 'react';
import { dataService } from '../services/mockData';
import { Card } from './common/Card';
import { PaymentMode, ProfitLossRecord } from '../types';

export const ProfitLossView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isSaving, setIsSaving] = useState(false);

  const salonId = dataService.getActiveSalonId() || 's1';
  const activeSalon = dataService.getActiveSalon();

  const [formData, setFormData] = useState<Omit<ProfitLossRecord, 'salonId' | 'month' | 'year'>>({
    rent: 0,
    royalty: 0,
    gst: 0,
    powerBill: 0,
    productsBill: 0,
    mobileInternet: 0,
    laundry: 0,
    marketing: 0,
    others: 0
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Auto-calculated data
  const calculateAutoFinancials = () => {
    // 1. Revenue (Direct + Packages)
    const invoices = dataService.getInvoices(salonId).filter(inv => {
      const d = new Date(inv.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    const directSales = invoices.filter(i => i.paymentMode !== PaymentMode.PACKAGE).reduce((acc, inv) => acc + inv.total, 0);

    const valPackages = dataService.getPackageSubscriptions(salonId).filter(pkg => {
      const d = new Date(pkg.assignedDate);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    const packageSales = valPackages.reduce((acc, pkg) => acc + pkg.paidAmount, 0);

    const sitPackages = dataService.getSittingPackageSubscriptions(salonId).filter(pkg => {
      const d = new Date(pkg.assignedDate);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    const sittingSales = sitPackages.reduce((acc, pkg) => acc + pkg.paidAmount, 0);

    const totalIncome = directSales + packageSales + sittingSales;

    // 2. Petty Cash Expenses (from Daily Cash Ledger)
    const expensesList = dataService.getExpenses(salonId).filter(exp => {
      const d = new Date(exp.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    const outletExpenses = expensesList.reduce((acc, exp) => acc + exp.expenseAmount, 0);

    // 3. Payroll
    const staffList = dataService.getStaff(salonId);
    let totalSalaries = 0;
    let totalIncentives = 0;

    staffList.forEach(s => {
      const stats = dataService.getMonthlyAttendanceStats(s.id, selectedMonth, selectedYear);
      const base = s.salary || 0;
      const daily = base / 30;
      const deductions = stats.effectiveDeductionDays * daily;
      const otPay = stats.extraHours * (daily / 8);
      totalSalaries += (base - deductions + otPay);

      const actualSales = dataService.calculateStaffSales(s.id, selectedMonth, selectedYear);
      const target = s.target || 0;
      totalIncentives += s.role === 'Staff' ? Math.max(0, (actualSales - target) * 0.10) : 0;
    });

    return { totalIncome, totalSalaries, totalIncentives, outletExpenses };
  };

  const auto = calculateAutoFinancials();

  useEffect(() => {
    const saved = dataService.getProfitLossRecord(salonId, selectedMonth, selectedYear);
    if (saved) {
      setFormData({
        rent: saved.rent,
        royalty: saved.royalty,
        gst: saved.gst,
        powerBill: saved.powerBill,
        productsBill: saved.productsBill,
        mobileInternet: saved.mobileInternet,
        laundry: saved.laundry,
        marketing: saved.marketing,
        others: saved.others
      });
    } else {
      setFormData({ rent: 0, royalty: 0, gst: 0, powerBill: 0, productsBill: 0, mobileInternet: 0, laundry: 0, marketing: 0, others: 0 });
    }
  }, [selectedMonth, selectedYear, salonId]);

  const totalExpenses = formData.rent + formData.royalty + auto.totalSalaries + auto.totalIncentives + formData.gst + 
                        formData.powerBill + formData.productsBill + formData.mobileInternet + formData.laundry + 
                        formData.marketing + formData.others + auto.outletExpenses;

  const totalProfit = auto.totalIncome - totalExpenses;

  const handleInputChange = (field: keyof typeof formData, val: string) => {
    const numeric = parseFloat(val) || 0;
    setFormData(prev => ({ ...prev, [field]: numeric }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      dataService.saveProfitLossRecord({
        salonId,
        month: selectedMonth,
        year: selectedYear,
        ...formData
      });
      setIsSaving(false);
      alert('P&L Audit Records committed successfully.');
    }, 800);
  };

  const Row = ({ label, description, amount, isEditable, field }: { label: string, description?: string, amount: number, isEditable?: boolean, field?: keyof typeof formData }) => (
    <div className={`flex items-center justify-between px-6 py-3 border-b border-slate-100 transition-colors hover:bg-slate-50/50`}>
      <div className="flex-1">
        <p className="text-[13px] font-semibold text-slate-700">{label}</p>
        {description && <p className="text-[10px] text-slate-400 font-medium">{description}</p>}
      </div>
      <div className="w-48 flex justify-end items-center gap-2">
        {isEditable ? (
          <div className="relative group">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs">₹</span>
             <input 
               type="number"
               className="w-32 py-1.5 pl-6 pr-3 bg-white border border-slate-200 rounded text-right text-[13px] font-bold text-slate-600 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all appearance-none"
               value={amount === 0 ? '' : amount}
               placeholder="0.00"
               onChange={e => handleInputChange(field!, e.target.value)}
             />
             <div className="absolute right-[-14px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-[10px] text-indigo-400 cursor-help">✎</span>
             </div>
          </div>
        ) : (
          <span className="text-[13px] font-black text-slate-700">₹{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Profit & Loss Audit</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-1">Operational yield & financial performance summary</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest outline-none shadow-sm cursor-pointer"
            value={selectedMonth}
            onChange={e => setSelectedMonth(parseInt(e.target.value))}
          >
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select 
            className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest outline-none shadow-sm cursor-pointer"
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
          >
            <option value={2023}>2023</option>
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-10 py-5 bg-[#0F172A] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center gap-3"
          >
            {isSaving ? '⏳ Committing...' : '💾 Commit Audit'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100">
        {/* INCOME HEADER */}
        <div className="bg-indigo-50/60 px-6 py-4 flex justify-between items-center border-b border-indigo-100">
          <span className="text-[13px] font-black text-indigo-900 uppercase">Total Income</span>
          <span className="text-[13px] font-black text-indigo-900">₹{auto.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>

        {/* EXPENSE LIST */}
        <div className="bg-white">
          <Row label="Rent" amount={formData.rent} isEditable field="rent" />
          <Row label="Royalty" amount={formData.royalty} isEditable field="royalty" />
          <Row 
            label="Salaries" 
            description="Total Salary to Credit from Payroll" 
            amount={auto.totalSalaries} 
          />
          <Row 
            label="Incentives" 
            description="From Payroll (automatically calculated based on staff targets)" 
            amount={auto.totalIncentives} 
          />
          <Row label="GST" amount={formData.gst} isEditable field="gst" />
          <Row label="Power Bill" amount={formData.powerBill} isEditable field="powerBill" />
          <Row label="Products Bill" amount={formData.productsBill} isEditable field="productsBill" />
          <Row label="Mobile & Internet" amount={formData.mobileInternet} isEditable field="mobileInternet" />
          <Row label="Laundry" amount={formData.laundry} isEditable field="laundry" />
          <Row label="Marketing" amount={formData.marketing} isEditable field="marketing" />
          <Row label="Others" amount={formData.others} isEditable field="others" />
          <Row 
            label="Outlet Expenses" 
            description="Daily Cash Ledger expenditures (petty cash)" 
            amount={auto.outletExpenses} 
          />
        </div>

        {/* SUMMARY FOOTER */}
        <div className="bg-rose-50/40 px-6 py-4 flex justify-between items-center border-b border-rose-100">
          <span className="text-[13px] font-black text-rose-600 uppercase">Total Expenses</span>
          <span className="text-[13px] font-black text-rose-600">₹{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="bg-emerald-50 px-6 py-4 flex justify-between items-center">
          <span className="text-[13px] font-black text-emerald-700 uppercase">Total Profit</span>
          <span className="text-[13px] font-black text-emerald-700">₹{totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* POLICY REMINDER */}
      <div className="bg-[#1E293B] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-xl">
             <h4 className="text-2xl font-black uppercase tracking-tight mb-4">P&L Submission Protocol</h4>
             <div className="space-y-4">
                <p className="text-sm text-slate-400 leading-relaxed">
                  <span className="text-white font-bold">Auto-Calculations:</span> Income, Salaries, and Incentives are derived directly from the <span className="text-indigo-400 font-bold">Sales Ledger</span> and <span className="text-indigo-400 font-bold">Personnel Registry</span>. Please ensure those modules are up-to-date before committing the P&L audit.
                </p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  <span className="text-white font-bold">Audit Lock:</span> Once saved, these figures are recorded for regional reporting. Managers should verify with physical bills before submitting "Power", "Rent", and "Product" components.
                </p>
             </div>
          </div>
          <div className="flex flex-col items-center p-8 bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-xl">
             <div className="text-5xl mb-4">💹</div>
             <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Yield Optimized</p>
             <p className="text-[10px] text-slate-500 mt-2 text-center">Commiting regular P&L data<br/>improves AI business forecasts.</p>
          </div>
        </div>
      </div>
    </div>
  );
};