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
import { UserRole, Staff, Invoice } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [autoShareInvoice, setAutoShareInvoice] = useState(false);
  
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [contextKey, setContextKey] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [invoiceList, setInvoiceList] = useState<Invoice[]>([]);
  const [staffSubView, setStaffSubView] = useState<'list' | 'attendance'>('list');
  const [staffPerformances, setStaffPerformances] = useState<Record<string, number>>({});

  const currentUser = dataService.getCurrentUser();

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

  const loadViewData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    const [staff, invoices] = await Promise.all([
      dataService.getStaff(),
      dataService.getInvoices()
    ]);
    
    setStaffList(staff);
    setInvoiceList(invoices);

    const performances: Record<string, number> = {};
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    await Promise.all(staff.map(async (s) => {
      const sales = await dataService.calculateStaffSales(s.id, thisMonth, thisYear);
      performances[s.id] = sales;
    }));

    setStaffPerformances(performances);
    setLoading(false);
  };

  useEffect(() => {
    const initAuth = async () => {
      const user = dataService.getCurrentUser();
      if (user) {
        setIsAuthenticated(true);
        if (user.role === UserRole.MANAGER) setActiveView('dashboard');
      }
      setIsAppLoading(false);
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadViewData();
    }
  }, [isAuthenticated, activeView, refreshKey]);

  const handleLogin = async () => {
    setIsAppLoading(true);
    const user = dataService.getCurrentUser();
    setIsAuthenticated(true);
    if (user?.role === UserRole.MANAGER) setActiveView('dashboard');
    else {
      dataService.setActiveSalonId(null);
      setActiveView('dashboard');
    }
    setContextKey(prev => prev + 1);
    setIsAppLoading(false);
  };

  const handleLogout = async () => {
    setIsAppLoading(true);
    await dataService.logout();
    setIsAuthenticated(false);
    setActiveView('dashboard');
    setShowInvoiceForm(false);
    setIsAppLoading(false);
  };

  const handleSetView = (view: string) => {
    setActiveView(view);
    setContextKey(prev => prev + 1);
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
      role: staff.role as any,
      salary: staff.salary || 0,
      target: staff.target || (staff.role === 'Staff' ? (staff.salary || 0) * 5 : 0),
      joiningDate: staff.joiningDate || new Date().toISOString().split('T')[0],
      exitDate: staff.exitDate || '',
      status: staff.status
    });
    setIsEmployeeModalOpen(true);
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaffId) {
      await dataService.updateStaff({ 
        ...staffForm, 
        id: editingStaffId, 
        salonId: dataService.getActiveSalonId() || 's1'
      } as Staff);
    } else {
      await dataService.addStaff(staffForm);
    }
    setRefreshKey(prev => prev + 1);
    setIsEmployeeModalOpen(false);
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
      role,
      target: role === 'Staff' ? (prev.salary || 0) * 5 : 0
    }));
  };

  const closeReceipt = () => {
    setSelectedInvoice(null);
    setAutoShareInvoice(false);
  };

  const handleDirectWhatsAppShare = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setAutoShareInvoice(true);
  };

  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Initializing Secure Connection...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  const renderContent = () => {
    if (showInvoiceForm) return <InvoiceForm onComplete={() => { setShowInvoiceForm(false); setRefreshKey(k => k + 1); }} />;
    if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest">Synchronizing Ledger...</div>;

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
            <div><h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Sales Ledger</h1><p className="text-sm text-slate-500 font-medium">Verified transactions</p></div>
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
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceList.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-5 text-sm font-black text-indigo-600 uppercase tracking-tighter">{inv.id}</td>
                      <td className="px-6 py-5">
                         <div className="text-sm font-black text-slate-900">{inv.customerName}</div>
                         <div className="text-[10px] font-bold text-slate-400">{inv.customerMobile}</div>
                      </td>
                      <td className="px-6 py-5 text-sm font-black text-slate-800">₹{inv.total.toFixed(2)}</td>
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
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Personnel Registry</h1>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Workforce Governance</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                <button onClick={() => setStaffSubView('list')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${staffSubView === 'list' ? 'bg-[#7C3AED] text-white shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}>Staff List</button>
                <button onClick={() => setStaffSubView('attendance')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${staffSubView === 'attendance' ? 'bg-[#7C3AED] text-white shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}>Attendance</button>
              </div>
              {staffSubView === 'list' && (
                <button onClick={openAddEmployee} className="px-10 py-3 bg-[#1E293B] text-white font-black uppercase tracking-widest text-[10px] rounded-[1.5rem] shadow-2xl transition active:scale-95">+ Add Personnel</button>
              )}
            </div>
          </div>

          {staffSubView === 'list' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {staffList.map(s => {
                const actualSales = staffPerformances[s.id] || 0;
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
                          </div>
                          <button onClick={() => openEditEmployee(s)} className="p-2.5 text-slate-300 hover:text-indigo-600 transition bg-slate-50 rounded-xl">✏️</button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Monthly Target</span>
                            <span className="text-[10px] font-black text-indigo-600">{Math.round(achievementPercent)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${cappedAchievement}%` }} />
                        </div>
                        <div className="flex justify-between border-t border-slate-50 pt-4">
                            <div className="text-[10px] font-bold text-slate-400">SALARY: ₹{(s.salary || 0).toLocaleString()}</div>
                            <div className="text-[10px] font-bold text-emerald-600">INCENTIVE: ₹{incentive.toLocaleString()}</div>
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
      
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative border border-slate-100 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => setIsEmployeeModalOpen(false)} 
              className="absolute top-10 right-10 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-full"
            >
              <span className="text-2xl">✕</span>
            </button>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Personnel Configuration</h2>
            
            <form onSubmit={handleStaffSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Legal Name *</label>
                  <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 transition-all" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} placeholder="e.g. Alex Rivera" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact No</label>
                  <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 transition-all" value={staffForm.phone} onChange={e => setStaffForm({...staffForm, phone: e.target.value})} placeholder="9876543210" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Operational Role</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Staff', 'Manager', 'House Keeping'] as const).map(role => (
                    <button 
                      key={role}
                      type="button"
                      onClick={() => handleRoleChange(role)}
                      className={`py-4 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${staffForm.role === role ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'}`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Monthly Base Salary (₹)</label>
                  <input type="number" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none" value={staffForm.salary || ''} onChange={e => handleSalaryChange(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1">Sales Target (Auto 5x)</label>
                  <input type="number" required className="w-full px-6 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl font-black text-indigo-600 outline-none" value={staffForm.target || ''} onChange={e => setStaffForm({...staffForm, target: parseFloat(e.target.value) || 0})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <button type="submit" className="py-5 bg-[#0F172A] text-white font-black rounded-3xl uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all">
                  {editingStaffId ? 'Update Profile' : 'Complete Registry'}
                </button>
                <button type="button" onClick={() => setIsEmployeeModalOpen(false)} className="py-5 bg-slate-100 text-slate-500 font-black rounded-3xl uppercase tracking-widest text-[11px]">
                  Discard
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