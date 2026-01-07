
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/mockData';
import { Card } from './common/Card';
import { UserRole, Invoice, PackageSubscription, SittingPackageSubscription } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const Dashboard: React.FC<{ onAction: (view: string) => void }> = ({ onAction }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    invoices: Invoice[];
    valPackages: PackageSubscription[];
    sitPackages: SittingPackageSubscription[];
    salons: any[];
  }>({
    invoices: [],
    valPackages: [],
    sitPackages: [],
    salons: []
  });

  const user = dataService.getCurrentUser();
  const activeSalonId = dataService.getActiveSalonId();
  // Removed unused activeSalon promise assignment that was causing typing issues
  const isGlobalView = !activeSalonId && (user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      const [invoices, valPackages, sitPackages, salons] = await Promise.all([
        dataService.getInvoices(),
        dataService.getPackageSubscriptions(),
        dataService.getSittingPackageSubscriptions(),
        dataService.getSalons()
      ]);
      setData({ invoices, valPackages, sitPackages, salons });
      setLoading(false);
    };
    loadDashboard();
  }, [activeSalonId]);

  const { invoices, valPackages, sitPackages, salons } = data;

  if (loading) {
    return (
      <div className="space-y-12 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-[400px] bg-slate-200 rounded-[2.5rem]"></div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const isToday = (dateStr: string) => dateStr.startsWith(todayStr);
  const isThisMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  };

  const todayInvoices = invoices.filter(inv => isToday(inv.date));
  const monthInvoices = invoices.filter(inv => isThisMonth(inv.date));

  const todayValPackages = valPackages.filter(pkg => isToday(pkg.assignedDate));
  const todaySitPackages = sitPackages.filter(pkg => isToday(pkg.assignedDate));
  const monthValPackages = valPackages.filter(pkg => isThisMonth(pkg.assignedDate));
  const monthSitPackages = sitPackages.filter(pkg => isThisMonth(pkg.assignedDate));

  const getRevenue = (invs: any[], vals: any[], sits: any[]) => {
    const invRevenue = invs
      .filter(i => i.paymentMode !== 'Package Wallet')
      .reduce((acc, inv) => acc + inv.total, 0);
    const valRevenue = vals.reduce((acc, pkg) => acc + pkg.paidAmount, 0);
    const sitRevenue = sits.reduce((acc, pkg) => acc + pkg.paidAmount, 0);
    return invRevenue + valRevenue + sitRevenue;
  };

  const todayGrossRevenue = getRevenue(todayInvoices, todayValPackages, todaySitPackages);
  const monthGrossRevenue = getRevenue(monthInvoices, monthValPackages, monthSitPackages);
  const monthFootfall = monthInvoices.length + monthValPackages.length + monthSitPackages.length;
  const totalUnusedCredits = valPackages.reduce((acc, pkg) => acc + (pkg.currentBalance || 0), 0);

  const chartData = isGlobalView ? salons.map(salon => {
    const sInvoices = invoices.filter(i => i.salonId === salon.id && isThisMonth(i.date));
    const sValPkgs = valPackages.filter(p => p.salonId === salon.id && isThisMonth(p.assignedDate));
    const sSitPkgs = sitPackages.filter(p => p.salonId === salon.id && isThisMonth(p.assignedDate));
    return {
      name: salon.name.split(' ').pop() || salon.name,
      fullName: salon.name,
      revenue: getRevenue(sInvoices, sValPkgs, sSitPkgs)
    };
  }).sort((a, b) => b.revenue - a.revenue) : [];

  const chartColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-indigo-50 border-indigo-100 relative overflow-hidden h-24 flex flex-col justify-center">
          <div className="relative z-10 px-6">
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Gross (Today)</p>
            <p className="text-xl font-black text-indigo-900 mt-0.5">₹{todayGrossRevenue.toLocaleString()}</p>
          </div>
          <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-100/50 rounded-bl-full"></div>
        </Card>
        <Card className="bg-emerald-50 border-emerald-100 relative overflow-hidden h-24 flex flex-col justify-center">
          <div className="relative z-10 px-6">
            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">Month MTD</p>
            <p className="text-xl font-black text-emerald-900 mt-0.5">₹{monthGrossRevenue.toLocaleString()}</p>
          </div>
          <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-100/50 rounded-bl-full"></div>
        </Card>
        <Card className="bg-amber-50 border-amber-100 relative overflow-hidden h-24 flex flex-col justify-center">
          <div className="relative z-10 px-6">
            <p className="text-[9px] font-black text-amber-400 uppercase tracking-[0.2em]">Liability Pool</p>
            <p className="text-xl font-black text-amber-900 mt-0.5">₹{totalUnusedCredits.toLocaleString()}</p>
          </div>
          <div className="absolute top-0 right-0 w-12 h-12 bg-amber-100/50 rounded-bl-full"></div>
        </Card>
        <Card className="bg-orange-50 border-orange-100 relative overflow-hidden h-24 flex flex-col justify-center">
          <div className="relative z-10 px-6">
            <p className="text-[9px] font-black text-orange-400 uppercase tracking-[0.2em]">Footfall</p>
            <p className="text-xl font-black text-orange-900 mt-0.5">{monthFootfall}</p>
          </div>
          <div className="absolute top-0 right-0 w-12 h-12 bg-orange-100/50 rounded-bl-full"></div>
        </Card>
      </div>

      {isGlobalView && chartData.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Regional Benchmarking</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Monthly Gross Revenue Distribution</p>
            </div>
          </div>
          <Card className="border-none shadow-2xl rounded-[2.5rem] p-10 bg-white overflow-hidden h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip cursor={{ fill: '#f8fafc' }} content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#1e293b] p-4 rounded-2xl shadow-2xl border border-slate-700">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.fullName}</p>
                        <p className="text-lg font-black text-white">₹{payload[0].value?.toLocaleString()}</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Bar dataKey="revenue" radius={[12, 12, 12, 12]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {!isGlobalView && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <Card title="Outlet Sales Ledger" className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt ID</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Name</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Gross Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.slice(0, 10).map((inv: Invoice) => (
                    <tr key={inv.id} className="hover:bg-slate-50/30 transition group">
                      <td className="px-8 py-5"><span className="text-sm font-black text-indigo-600">{inv.id}</span></td>
                      <td className="px-8 py-5"><div className="text-sm font-black text-slate-900">{inv.customerName}</div></td>
                      <td className="px-8 py-5 text-right font-black text-slate-900">₹{inv.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
