import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { InvoiceForm } from './components/InvoiceForm';
import { Attendance } from './components/Attendance';
import { SalonsView } from './components/SalonsView';
import { ServicesView } from './components/ServicesView';
import { VouchersView } from './components/VouchersView';
import { PackagesView } from './components/PackagesView';
import { ExpensesView } from './components/ExpensesView';
import { AdminsView } from './components/AdminsView';
import { ManagersView } from './components/ManagersView';
import { CustomersView } from './components/CustomersView';
import { PayrollView } from './components/PayrollView';
import { ProfitLossView } from './components/ProfitLossView';
import { PackageTemplatesView } from './components/PackageTemplatesView';
import { Login } from './components/Login';
import { InvoiceReceipt } from './components/InvoiceReceipt';
import { dataService } from './services/mockData';
import { Card } from './components/common/Card';
import { UserRole, Staff, Invoice, PaymentMode } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [autoShareInvoice, setAutoShareInvoice] = useState(false);
  
  const [staffSubView, setStaffSubView] = useState<'list' | 'attendance'>('list');
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const [staffForm, setStaffForm] = useState<Omit<Staff, 'id' | 'salonId'>>({
    name: '',
    phone: '',
    role: 'Staff',
    salary: 0,
    target: 0,
    joiningDate: new Date().toISOString().split('T')[0],
    exitDate: '',
    status: 'Active'
  });

  // A simple state to trigger re-renders when dataService context changes
  const [contextKey, setContextKey] = useState(0);

  const currentUser = dataService.getCurrentUser();
  const isAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    if (currentUser) {
      setIsAuthenticated(true);
      if (currentUser.role === UserRole.MANAGER) setActiveView('dashboard');
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    const user = dataService.getCurrentUser();
    if (user?.role === UserRole.MANAGER) setActiveView('dashboard');
    else {
      dataService.setActiveSalonId(null);
      setActiveView('dashboard');
    }
    setContextKey(prev => prev + 1);
  };

  const handleLogout = () => {
    dataService.logout();
    setIsAuthenticated(false);
    setActiveView('dashboard');
    setShowInvoiceForm(false);
    setContextKey(0);
  };

  const handleSetView = (view: string) => {
    setActiveView(view);
    setContextKey(prev => prev + 1);
  };

  const handleDirectWhatsAppShare = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setAutoShareInvoice(true);
  };

  const closeReceipt = () => {
    setSelectedInvoice(null);
    setAutoShareInvoice(false);
  };

  const openAddEmployee = () => {
    setEditingStaffId(null);
    setStaffForm({
      name: '',
      phone: '',
      role: 'Staff',
      salary: 0,
      target: 0,
      joiningDate: new Date().toISOString().split('T')[0],
      exitDate: '',
      status: 'Active'
    });
    setIsEmployeeModalOpen(true);
  };

  const openEditEmployee = (staff: Staff) => {
    setEditingStaffId(staff.id);
    setStaffForm({
      name: staff.name,
      phone: staff.phone || '',
      role: staff.role,
      salary: staff.salary || 0,
      target: staff.target || (staff.role === 'Staff' ? (staff.salary || 0) * 5 : 0),
      joiningDate: staff.joiningDate || new Date().toISOString().split('T')[0],
      exitDate: staff.exitDate || '',
      status: staff.status
    });
    setIsEmployeeModalOpen(true);
  };

  const handleSalaryChange = (val: number) => {
    setStaffForm(prev => ({
      ...prev,
      salary: val,
      target: prev.role === 'Staff' ? val * 5 : 0
    }));
  };

  const handleRoleChange = (role: 'Staff' | 'Manager' | 'House Keeping') => {
    setStaffForm(prev => ({
      ...prev,
      role: role,
      target: role === 'Staff' ? (prev.salary || 0) * 5 : 0
    }));
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaffId) {
      dataService.updateStaff({ 
        ...staffForm, 
        id: editingStaffId, 
        salonId: dataService.getActiveSalonId() || 's1'
      });
    } else {
      dataService.addStaff(staffForm);
    }
    setRefreshKey(prev => prev + 1);
    setIsEmployeeModalOpen(false);
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  const renderContent = () => {
    if (showInvoiceForm) return <InvoiceForm onComplete={() => setShowInvoiceForm(false)} />;

    switch (activeView) {
      case 'dashboard': return <Dashboard onAction={handleSetView} />;
      case 'salons': return <SalonsView onManage={(id) => { dataService.setActiveSalonId(id); handleSetView('dashboard'); }} />;
      case 'admins': return <AdminsView />;
      case 'managers': return <ManagersView />;
      case 'customers': return <CustomersView />;
      case 'services': return <ServicesView />;
      case 'vouchers': return <VouchersView />;
      case 'package_templates': return <PackageTemplatesView />;
      case 'packages': return <PackagesView />;
      case 'expenses': return <ExpensesView />;
      case 'payroll': return <PayrollView />;
      case 'profit_loss': return <ProfitLossView />;
      case 'invoices': return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div><h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Sales Ledger</h1><p className="text-sm text-slate-500 font-medium">Verified transactions for {dataService.getActiveSalon()?.name || 'All Outlets'}</p></div>
            <button onClick={() => setShowInvoiceForm(true)} className="px-8 py-3 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-indigo-700 transition shadow-lg">+ New Invoice</button>
          </div>
          <Card className="border-none shadow-xl rounded-[2rem]">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt ID</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Value</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {dataService.getInvoices().map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-5 text-sm font-black text-indigo-600 uppercase tracking-tighter">{inv.id}</td>
                      <td className="px-6 py-5">
                         <div className="text-sm font-black text-slate-900">{inv.customerName}</div>
                         <div className="text-[10px] font-bold text-slate-400">{inv.customerMobile}</div>
                      </td>
                      <td className="px-6 py-5 text-sm font-black text-slate-800">₹{inv.total.toFixed(2)}</td>
                      <td className="px-6 py-5"><span className="text-[10px] font-black text-slate-500 uppercase bg-slate-100 px-3 py-1.5 rounded-xl">{inv.packageName || inv.paymentMode}</span></td>
                      <td className="px-6 py-5 text-right"><div className="flex justify-end gap-2"><button onClick={() => setSelectedInvoice(inv)} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-4 py-2.5 rounded-xl transition hover:bg-indigo-600 hover:text-white">Review</button><button onClick={() => handleDirectWhatsAppShare(inv)} className="text-[10px] font-black uppercase tracking-widest text-white bg-emerald-500 px-5 py-2.5 rounded-xl transition shadow-xl shadow-emerald-500/10 active:scale-95">📲 Share</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {selectedInvoice && <InvoiceReceipt invoice={selectedInvoice} onClose={closeReceipt} autoShare={autoShareInvoice} />}
        </div>
      );
      case 'staff': return (
        <div className="space-y-8 animate-in fade-in duration-500" key={refreshKey}>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Personnel Registry</h1>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Workforce & Performance Governance</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                <button onClick={() => setStaffSubView('list')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${staffSubView === 'list' ? 'bg-[#7C3AED] text-white shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}>Staff List</button>
                <button onClick={() => setStaffSubView('attendance')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${staffSubView === 'attendance' ? 'bg-[#7C3AED] text-white shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}>Attendance</button>
              </div>
              {staffSubView === 'list' && (
                <button 
                  onClick={openAddEmployee} 
                  className="px-10 py-3 bg-[#1E293B] text-white font-black uppercase tracking-widest text-[10px] rounded-[1.5rem] shadow-2xl transition active:scale-95"
                >
                  + Add Personnel
                </button>
              )}
            </div>
          </div>

          {staffSubView === 'list' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dataService.getStaff().map(s => {
                const thisMonth = new Date().getMonth();
                const thisYear = new Date().getFullYear();
                const actualSales = dataService.calculateStaffSales(s.id, thisMonth, thisYear);
                const target = s.target || 0;
                const achievementPercent = target > 0 ? (actualSales / target) * 100 : 0;
                const cappedAchievement = Math.min(100, achievementPercent);
                const incentive = Math.max(0, (actualSales - target) * 0.10);

                return (
                  <Card key={s.id} className="border-none shadow-xl rounded-[2.5rem] p-8 group hover:shadow-2xl transition-all relative overflow-hidden">
                    <div className="flex items-center gap-5 relative z-10">
                      <div className="w-16 h-16 bg-slate-50 text-indigo-600 flex items-center justify-center rounded-2xl text-2xl font-black transition-colors group-hover:bg-[#7C3AED] group-hover:text-white shadow-inner">
                        {s.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-black text-slate-900">{s.name}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{s.role}</p>
                            {s.phone && <p className="text-[10px] font-bold text-slate-500 mt-1">📞 {s.phone}</p>}
                          </div>
                          <button onClick={() => openEditEmployee(s)} className="p-2.5 text-slate-300 hover:text-indigo-600 transition bg-slate-50 rounded-xl">✏️</button>
                        </div>
                      </div>
                    </div>

                    {s.role === 'Staff' && (
                      <div className="mt-8 space-y-4 relative z-10">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Monthly Sales Progression</p>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-xl font-black text-slate-800">₹{actualSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              <span className="text-[10px] font-bold text-slate-400">/ ₹{target.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="text-right">
                             <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl ${achievementPercent >= 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                               {Math.round(achievementPercent)}%
                             </span>
                          </div>
                        </div>
                        
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full transition-all duration-1000 ease-out rounded-full ${achievementPercent >= 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-indigo-600'}`}
                            style={{ width: `${cappedAchievement}%` }}
                          />
                        </div>

                        <div className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${incentive > 0 ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                           <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estimated Surplus Bonus</p>
                             <p className={`text-sm font-black ${incentive > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                               ₹{incentive.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                             </p>
                           </div>
                           {incentive > 0 && <span className="text-lg">📈</span>}
                        </div>
                      </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-end relative z-10">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base Monthly Pay</p>
                        <p className="text-sm font-black text-slate-800">₹{(s.salary || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${s.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          {s.status}
                        </span>
                        {s.joiningDate && <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Onboard: {new Date(s.joiningDate).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {staffSubView === 'attendance' && <Attendance />}
        </div>
      );
      default: return <Dashboard onAction={handleSetView} />;
    }
  };

  return (
    <Layout 
      key={contextKey} 
      activeView={activeView} 
      setActiveView={handleSetView} 
      onLogout={handleLogout}
    >
      {renderContent()}

      {/* SHARED STAFF MODAL */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[650px] rounded-[3rem] p-12 shadow-2xl relative overflow-hidden border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => setIsEmployeeModalOpen(false)} 
              className="absolute top-10 right-10 w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-full"
            >
              <span className="text-3xl font-light">✕</span>
            </button>
            <h2 className="text-3xl font-black text-[#0F172A] mb-10 tracking-tight uppercase">
              {editingStaffId ? 'Refine Profile' : 'Onboard Employee'}
            </h2>
            <form onSubmit={handleStaffSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name *</label>
                  <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold text-[#1E293B] transition-all" value={staffForm.name} onChange={e => setStaffForm(prev => ({...prev, name: e.target.value}))} placeholder="e.g. Rahul Sharma" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Verified Mobile</label>
                  <input type="tel" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold text-[#1E293B] transition-all" value={staffForm.phone} onChange={e => setStaffForm(prev => ({...prev, phone: e.target.value}))} placeholder="10-digit primary contact" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Deployment Role *</label>
                  <select required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold text-[#1E293B] appearance-none cursor-pointer transition-all" value={staffForm.role} onChange={e => handleRoleChange(e.target.value as any)}>
                    <option value="Staff">Staff / Stylist</option>
                    <option value="Manager">Manager</option>
                    <option value="House Keeping">House Keeping</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Agreed Monthly Salary (₹) *</label>
                  <input type="number" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold text-[#1E293B] transition-all" value={staffForm.salary || ''} onChange={e => handleSalaryChange(parseFloat(e.target.value) || 0)} placeholder="Gross base per month" />
                </div>
                {staffForm.role === 'Staff' && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[11px] font-black text-indigo-400 uppercase tracking-widest ml-1">Mandatory Target (5x Salary)</label>
                    <div className="relative">
                      <input readOnly className="w-full px-6 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl outline-none font-black text-indigo-600 cursor-not-allowed" value={staffForm.target ? `₹${staffForm.target.toLocaleString()}` : '0'} />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Joining Date *</label>
                  <input required type="date" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold text-[#1E293B] transition-all" value={staffForm.joiningDate} onChange={e => setStaffForm(prev => ({...prev, joiningDate: e.target.value}))} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 border-t border-slate-50 pt-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                  <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-[#1E293B]" value={staffForm.status} onChange={e => setStaffForm(prev => ({...prev, status: e.target.value as any}))}>
                    <option value="Active">Active Duty</option>
                    <option value="Inactive">Exited</option>
                  </select>
                </div>
                {staffForm.status === 'Inactive' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-rose-500 uppercase tracking-widest ml-1">Exit Date *</label>
                    <input required type="date" className="w-full px-6 py-4 bg-rose-50 border border-rose-100 rounded-2xl font-bold text-rose-600" value={staffForm.exitDate} onChange={e => setStaffForm(prev => ({...prev, exitDate: e.target.value}))} />
                  </div>
                )}
              </div>
              <div className="flex gap-6 pt-10">
                <button type="submit" className="flex-[2] py-6 bg-[#0F172A] text-white font-black rounded-3xl uppercase tracking-widest text-[12px] shadow-2xl hover:bg-black active:scale-[0.98] transition-all">
                  {editingStaffId ? 'Commit Changes' : 'Finalize Onboarding'}
                </button>
                <button type="button" onClick={() => setIsEmployeeModalOpen(false)} className="flex-1 py-6 bg-slate-100 text-slate-500 font-black rounded-3xl uppercase tracking-widest text-[12px] hover:bg-slate-200 transition-all shadow-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;