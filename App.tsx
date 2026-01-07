
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
  
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [contextKey, setContextKey] = useState(0);

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
        <div className="p-4"><p className="text-xs text-slate-400 font-bold uppercase">Sales Ledger Loaded.</p></div>
      );
      case 'staff': return (
        <div className="p-4"><p className="text-xs text-slate-400 font-bold uppercase">Personnel Registry Loaded.</p></div>
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
    </Layout>
  );
};

export default App;
