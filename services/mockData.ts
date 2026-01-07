import { Salon, Staff, Invoice, AttendanceRecord, User, UserRole, Service, Voucher, Package, AttendanceStatus, Customer, PackageTemplate, PackageSubscription, PaymentMode, InvoiceItem, SittingPackageTemplate, SittingPackageSubscription, Expense, ProfitLossRecord } from '../types';
import { INITIAL_SALONS, INITIAL_STAFF, INITIAL_INVOICES, INITIAL_SERVICES, INITIAL_VOUCHERS, INITIAL_PACKAGES } from '../constants';

export interface ReferralVoucher {
  id: string;
  guestName: string;
  guestMobile: string;
  referringName: string;
  billNo: string;
  validFrom: string;
  validTill: string;
  status: 'Active' | 'Redeemed' | 'Expired';
  discount: string;
  dateIssued: string;
}

class DataService {
  private salons: Salon[] = [];
  private staff: Staff[] = [];
  private invoices: Invoice[] = [];
  private services: Service[] = [];
  private packages: Package[] = [];
  private vouchers: Voucher[] = [];
  private referralVouchers: ReferralVoucher[] = [];
  private packageTemplates: PackageTemplate[] = [];
  private sittingPackageTemplates: SittingPackageTemplate[] = [];
  private packageSubscriptions: PackageSubscription[] = [];
  private sittingPackageSubscriptions: SittingPackageSubscription[] = [];
  private customers: Customer[] = [];
  private attendance: AttendanceRecord[] = [];
  private users: User[] = [];
  private expenses: Expense[] = [];
  private plRecords: ProfitLossRecord[] = [];

  constructor() {
    this.salons = JSON.parse(localStorage.getItem('luxe_salons') || 'null') || [...INITIAL_SALONS].map(s => ({ ...s, gstNumber: '36GST3456THD', contact: '9876543210' }));
    this.staff = JSON.parse(localStorage.getItem('luxe_staff') || 'null') || [...INITIAL_STAFF];
    this.invoices = JSON.parse(localStorage.getItem('luxe_invoices') || 'null') || [...INITIAL_INVOICES];
    this.services = JSON.parse(localStorage.getItem('luxe_services') || 'null') || [...INITIAL_SERVICES];
    this.packages = JSON.parse(localStorage.getItem('luxe_packages') || 'null') || [...INITIAL_PACKAGES];
    this.vouchers = JSON.parse(localStorage.getItem('luxe_vouchers') || 'null') || [
      ...INITIAL_VOUCHERS,
      { id: 'v_policy_35', code: 'POLICY35', salonId: 's1', value: 0, balance: 0, status: 'Active' }
    ];
    this.expenses = JSON.parse(localStorage.getItem('luxe_expenses') || '[]');
    this.plRecords = JSON.parse(localStorage.getItem('luxe_pl_records') || '[]');
    
    // Load dynamic users from localStorage
    const defaultUsers: User[] = [
      { id: 'u_super', name: 'Global CEO', username: 'super', password: '123', role: UserRole.SUPER_ADMIN },
      { id: 'u_admin_regional', name: 'Regional Director', username: 'admin', password: '123', role: UserRole.ADMIN, salonIds: ['s1', 's2'] },
      { id: 'u_m1', name: 'Downtown Manager', username: 'manager1', password: '123', role: UserRole.MANAGER, salonIds: ['s1'] },
      { id: 'u_m2', name: 'Suburban Manager', username: 'manager2', password: '123', role: UserRole.MANAGER, salonIds: ['s2'] },
    ];
    this.users = JSON.parse(localStorage.getItem('luxe_users') || 'null') || defaultUsers;

    const savedUser = localStorage.getItem('luxe_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      this.currentUser = this.users.find(u => u.username === parsed.username) || parsed;
      if (this.currentUser?.salonIds?.length && this.currentUser.role === UserRole.MANAGER) {
        this.activeSalonId = this.currentUser.salonIds[0];
      } else {
        this.activeSalonId = null;
      }
    }
    
    this.referralVouchers = JSON.parse(localStorage.getItem('luxe_referral_vouchers') || '[]');
    
    // Initialize Core Package Templates
    const defaultPackageTemplates: PackageTemplate[] = [
      { id: 'pt1', name: 'Silver Wallet (Pay ₹4500 get ₹5000)', paidAmount: 4500, offeredValue: 5000, salonIds: this.salons.map(s => s.id) },
      { id: 'pt2', name: 'Gold Wallet (Pay ₹10000 get ₹12000)', paidAmount: 10000, offeredValue: 12000, salonIds: this.salons.map(s => s.id) },
      { id: 'pt3', name: 'Platinum Wallet (Pay ₹20000 get ₹25000)', paidAmount: 20000, offeredValue: 25000, salonIds: this.salons.map(s => s.id) },
      { id: 'pt4', name: 'Diamond Anniversary (Pay ₹45000 get ₹60000)', paidAmount: 45000, offeredValue: 60000, salonIds: this.salons.map(s => s.id) },
    ];

    const defaultSittingTemplates: SittingPackageTemplate[] = [
      { id: 'st1', name: 'Standard Bundle (3+1)', paidSittings: 3, compSittings: 1, totalSittings: 4, salonIds: this.salons.map(s => s.id) },
      { id: 'st2', name: 'Silver Bundle (6+2)', paidSittings: 6, compSittings: 2, totalSittings: 8, salonIds: this.salons.map(s => s.id) },
      { id: 'st3', name: 'Gold Bundle (9+3)', paidSittings: 9, compSittings: 3, totalSittings: 12, salonIds: this.salons.map(s => s.id) },
    ];

    this.packageTemplates = JSON.parse(localStorage.getItem('luxe_pkg_templates') || JSON.stringify(defaultPackageTemplates));
    this.sittingPackageTemplates = JSON.parse(localStorage.getItem('luxe_sit_templates') || JSON.stringify(defaultSittingTemplates));

    this.packageSubscriptions = JSON.parse(localStorage.getItem('luxe_package_subs') || '[]');
    this.sittingPackageSubscriptions = JSON.parse(localStorage.getItem('luxe_sitting_package_subs') || '[]');
    this.customers = JSON.parse(localStorage.getItem('luxe_customers') || '[]');
    this.attendance = JSON.parse(localStorage.getItem('luxe_attendance') || '[]');
  }

  private currentUser: User | null = null;
  private activeSalonId: string | null = null;

  // User/Admin Management
  getAdmins() {
    return this.users.filter(u => u.role === UserRole.ADMIN);
  }

  getManagers() {
    if (this.currentUser?.role === UserRole.SUPER_ADMIN) {
      return this.users.filter(u => u.role === UserRole.MANAGER);
    }
    // Admins see managers of the outlets they control
    return this.users.filter(u => u.role === UserRole.MANAGER && u.salonIds?.some(sid => this.currentUser?.salonIds?.includes(sid)));
  }

  addAdmin(u: Omit<User, 'id'>) {
    const newUser = { ...u, id: `u_admin_${Date.now()}` };
    this.users.push(newUser);
    localStorage.setItem('luxe_users', JSON.stringify(this.users));
    return newUser;
  }

  addManager(u: Omit<User, 'id'>) {
    const newUser = { ...u, id: `u_mgr_${Date.now()}` };
    this.users.push(newUser);
    localStorage.setItem('luxe_users', JSON.stringify(this.users));
    return newUser;
  }

  updateUser(id: string, data: Partial<User>) {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx > -1) {
      this.users[idx] = { ...this.users[idx], ...data };
      localStorage.setItem('luxe_users', JSON.stringify(this.users));
    }
  }

  deleteUser(id: string) {
    this.users = this.users.filter(u => u.id !== id);
    localStorage.setItem('luxe_users', JSON.stringify(this.users));
  }

  login(username: string, password: string): User | null {
    const user = this.users.find(u => u.username === username && u.password === password);
    if (user) {
      this.currentUser = { ...user };
      delete this.currentUser.password;
      localStorage.setItem('luxe_user', JSON.stringify(this.currentUser));
      if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
        this.activeSalonId = null; 
      } else if (user.salonIds?.length) {
        this.activeSalonId = user.salonIds[0];
      }
      return this.currentUser;
    }
    return null;
  }

  logout() {
    this.currentUser = null;
    this.activeSalonId = null;
    localStorage.removeItem('luxe_user');
  }

  getCurrentUser() { return this.currentUser; }
  getActiveSalonId() { return this.activeSalonId; }
  setActiveSalonId(id: string | null) { this.activeSalonId = id; }
  getActiveSalon() { return this.salons.find(s => s.id === this.getActiveSalonId()); }
  
  getSalons() { 
    if (!this.currentUser) return [];
    if (this.currentUser.role === UserRole.SUPER_ADMIN) return this.salons;
    return this.salons.filter(s => this.currentUser?.salonIds?.includes(s.id));
  }

  // Enforcement of scoping for global lists
  getAllInvoices() {
    if (this.currentUser?.role === UserRole.SUPER_ADMIN) return this.invoices;
    const allowed = this.currentUser?.salonIds || [];
    return this.invoices.filter(i => allowed.includes(i.salonId));
  }

  getAllPackageSubscriptions() {
    if (this.currentUser?.role === UserRole.SUPER_ADMIN) return this.packageSubscriptions;
    const allowed = this.currentUser?.salonIds || [];
    return this.packageSubscriptions.filter(s => allowed.includes(s.salonId));
  }

  getAllSittingPackageSubscriptions() {
    if (this.currentUser?.role === UserRole.SUPER_ADMIN) return this.sittingPackageSubscriptions;
    const allowed = this.currentUser?.salonIds || [];
    return this.sittingPackageSubscriptions.filter(s => allowed.includes(s.salonId));
  }

  getInvoices(salonId?: string) {
    const sid = salonId || this.getActiveSalonId();
    if (!sid) return this.getAllInvoices();
    return this.invoices.filter(i => i.salonId === sid);
  }

  getServices() { return this.services; }
  addService(s: Omit<Service, 'id'>) {
    const newService = { ...s, id: `svc_${Date.now()}` };
    this.services.unshift(newService);
    localStorage.setItem('luxe_services', JSON.stringify(this.services));
    return newService;
  }
  updateService(s: Service) {
    const idx = this.services.findIndex(item => item.id === s.id);
    if (idx > -1) {
      this.services[idx] = s;
      localStorage.setItem('luxe_services', JSON.stringify(this.services));
    }
  }
  deleteService(id: string) {
    this.services = this.services.filter(s => s.id !== id);
    localStorage.setItem('luxe_services', JSON.stringify(this.services));
  }

  getStaff(salonId?: string) { 
    const sid = salonId || this.getActiveSalonId();
    if (!sid) {
      if (this.currentUser?.role === UserRole.SUPER_ADMIN) return this.staff;
      const allowed = this.currentUser?.salonIds || [];
      return this.staff.filter(s => allowed.includes(s.salonId));
    }
    return this.staff.filter(s => s.salonId === sid); 
  }
  
  getPackageTemplates(salonId?: string) {
    const sid = salonId || this.getActiveSalonId();
    if (!sid) return this.packageTemplates;
    return this.packageTemplates.filter(t => t.salonIds.includes(sid));
  }
  getSittingPackageTemplates(salonId?: string) {
    const sid = salonId || this.getActiveSalonId();
    if (!sid) return this.sittingPackageTemplates;
    return this.sittingPackageTemplates.filter(t => t.salonIds.includes(sid));
  }
  
  addPackageTemplate(t: Omit<PackageTemplate, 'id'>) {
    const newTemplate = { ...t, id: `pt_${Date.now()}` };
    this.packageTemplates.push(newTemplate);
    localStorage.setItem('luxe_pkg_templates', JSON.stringify(this.packageTemplates));
    return newTemplate;
  }

  deletePackageTemplate(id: string) {
    this.packageTemplates = this.packageTemplates.filter(t => t.id !== id);
    localStorage.setItem('luxe_pkg_templates', JSON.stringify(this.packageTemplates));
  }

  addSittingPackageTemplate(t: Omit<SittingPackageTemplate, 'id'>) {
    const newTemplate = { ...t, id: `st_${Date.now()}` };
    this.sittingPackageTemplates.push(newTemplate);
    localStorage.setItem('luxe_sit_templates', JSON.stringify(this.sittingPackageTemplates));
    return newTemplate;
  }

  deleteSittingPackageTemplate(id: string) {
    this.sittingPackageTemplates = this.sittingPackageTemplates.filter(t => t.id !== id);
    localStorage.setItem('luxe_sit_templates', JSON.stringify(this.sittingPackageTemplates));
  }

  getPackageSubscriptions(salonId?: string) {
    const sid = salonId || this.getActiveSalonId();
    if (!sid) return this.getAllPackageSubscriptions();
    return this.packageSubscriptions.filter(s => s.salonId === sid);
  }
  getSittingPackageSubscriptions(salonId?: string) {
    const sid = salonId || this.getActiveSalonId();
    if (!sid) return this.getAllSittingPackageSubscriptions();
    return this.sittingPackageSubscriptions.filter(s => s.salonId === sid);
  }

  addPackageSubscription(sub: PackageSubscription) {
    this.packageSubscriptions.unshift(sub);
    localStorage.setItem('luxe_package_subs', JSON.stringify(this.packageSubscriptions));
    this.saveCustomer({ mobile: sub.customerMobile, name: sub.customerName });
  }
  addSittingPackageSubscription(sub: SittingPackageSubscription) {
    this.sittingPackageSubscriptions.unshift(sub);
    localStorage.setItem('luxe_sitting_package_subs', JSON.stringify(this.sittingPackageSubscriptions));
    this.saveCustomer({ mobile: sub.customerMobile, name: sub.customerName });
  }
  redeemSittingPackage(subId: string, staffId: string, staffName: string) {
    const sub = this.sittingPackageSubscriptions.find(s => s.id === subId);
    if (sub && sub.remainingSittings > 0) {
      sub.sittingsUsed += 1;
      sub.remainingSittings -= 1;
      sub.history.push({
        date: new Date().toISOString().split('T')[0],
        staffId,
        staffName,
        type: 'Redemption'
      });
      if (sub.remainingSittings === 0) sub.status = 'Consumed';
      localStorage.setItem('luxe_sitting_package_subs', JSON.stringify(this.sittingPackageSubscriptions));
      return sub;
    }
    return null;
  }
  deductFromPackage(mobile: string, amount: number, billNo: string, items?: InvoiceItem[]) {
    const sub = this.packageSubscriptions.find(s => s.customerMobile === mobile && s.status === 'Active' && s.salonId === this.getActiveSalonId());
    if (sub) {
      const balanceAfter = sub.currentBalance - amount;
      sub.currentBalance = balanceAfter;
      sub.history.push({
        date: new Date().toISOString().split('T')[0],
        amount: -amount,
        description: `Usage - Bill #${billNo}`,
        balanceAfter,
        items: items?.map(i => ({ serviceName: i.serviceName, quantity: i.quantity, price: i.price, staffId: i.staffId }))
      });
      if (balanceAfter <= 0) sub.status = 'FullyConsumed';
      localStorage.setItem('luxe_package_subs', JSON.stringify(this.packageSubscriptions));
      return sub;
    }
    return null;
  }
  
  // Customer Methods
  getCustomers() { return this.customers; }
  findCustomer(mobile: string) { return this.customers.find(c => c.mobile === mobile); }
  saveCustomer(customer: Customer) {
    const index = this.customers.findIndex(c => c.mobile === customer.mobile);
    if (index > -1) this.customers[index] = customer;
    else this.customers.push(customer);
    localStorage.setItem('luxe_customers', JSON.stringify(this.customers));
  }
  bulkAddCustomers(newOnes: Customer[]) {
    newOnes.forEach(nc => {
      const idx = this.customers.findIndex(c => c.mobile === nc.mobile);
      if (idx > -1) this.customers[idx] = nc;
      else this.customers.push(nc);
    });
    localStorage.setItem('luxe_customers', JSON.stringify(this.customers));
  }
  deleteCustomer(mobile: string) {
    this.customers = this.customers.filter(c => c.mobile !== mobile);
    localStorage.setItem('luxe_customers', JSON.stringify(this.customers));
  }

  getReferralVouchers() { return this.referralVouchers; }
  addReferralVoucher(v: ReferralVoucher) {
    this.referralVouchers.unshift(v);
    localStorage.setItem('luxe_referral_vouchers', JSON.stringify(this.referralVouchers));
  }
  getVouchersByMobile(mobile: string, salonId?: string) {
    const sid = salonId || this.getActiveSalonId();
    if (!sid) return { system: this.vouchers, referrals: this.referralVouchers.filter(v => v.guestMobile === mobile) };
    const systemVouchers = this.vouchers.filter(v => v.salonId === sid && (!v.customerMobile || v.customerMobile === mobile));
    const activeReferrals = this.referralVouchers.filter(v => v.guestMobile === mobile && v.status === 'Active');
    return { system: systemVouchers, referrals: activeReferrals };
  }
  getAttendance(date: string, salonId?: string) {
    const sid = salonId || this.getActiveSalonId();
    if (!sid) return this.attendance.filter(a => a.date === date);
    const salonStaffIds = this.staff.filter(s => s.salonId === sid).map(s => s.id);
    return this.attendance.filter(a => a.date === date && salonStaffIds.includes(a.staffId));
  }
  calculateExtraHours(checkIn: string, checkOut: string, date: string): number {
    if (!checkIn || !checkOut) return 0;
    const [h1, m1] = checkIn.split(':').map(Number);
    const [h2, m2] = checkOut.split(':').map(Number);
    const durationHours = (h2 + m2/60) - (h1 + m1/60);
    const shiftRequired = (new Date(date).getDay() === 0 || new Date(date).getDay() === 6) ? 10 : 9;
    const extraRaw = durationHours - shiftRequired;
    return extraRaw > 0.75 ? Math.max(1, Math.round(extraRaw)) : 0;
  }
  getMonthlyAttendanceStats(staffId: string, month: number, year: number) {
    const records = this.attendance.filter(a => {
      const d = new Date(a.date);
      return a.staffId === staffId && d.getMonth() === month && d.getFullYear() === year;
    });
    let extraHours = 0, deductions = 0;
    records.forEach(r => {
      if (r.status === AttendanceStatus.PRESENT && r.checkIn && r.checkOut) {
        extraHours += this.calculateExtraHours(r.checkIn, r.checkOut, r.date);
      }
      
      if (r.status === AttendanceStatus.LEAVE) {
        const d = new Date(r.date);
        const day = d.getDay(); 
        if (day === 0 || day === 6) {
          deductions += 2;
        } else {
          deductions += 1;
        }
      }
    });
    
    return { 
      present: records.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.WEEKOFF).length, 
      lopDays: deductions,
      extraHours, 
      effectiveDeductionDays: deductions,
      absent: records.filter(r => r.status === AttendanceStatus.LEAVE).length
    };
  }

  calculateStaffSales(staffId: string, month: number, year: number) {
    const salonId = this.getActiveSalonId();
    const invoices = this.getInvoices(salonId);
    const invoiceSales = invoices
      .filter(inv => {
        const d = new Date(inv.date);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((acc, inv) => {
        const discountRatio = inv.subtotal > 0 ? (inv.subtotal - inv.discount) / inv.subtotal : 1;
        inv.items.forEach(item => {
          if (item.staffId === staffId) {
            if (inv.paymentMode === PaymentMode.PACKAGE) {
              acc += (item.price * item.quantity) * 0.6;
            } else {
              acc += (item.price * item.quantity) * discountRatio;
            }
          }
        });
        return acc;
      }, 0);

    const valueSubs = this.getPackageSubscriptions(salonId);
    const directWalletSales = valueSubs.reduce((acc, sub) => {
      sub.history.forEach(h => {
        if (h.items) {
          const d = new Date(h.date);
          if (d.getMonth() === month && d.getFullYear() === year) {
             if (h.description.includes('Usage - Bill #')) return;
             h.items.forEach((item: any) => {
                if (item.staffId === staffId) {
                   acc += (item.price * (item.quantity || 1)) * 0.6;
                }
             });
          }
        }
      });
      return acc;
    }, 0);

    const sittingSubs = this.getSittingPackageSubscriptions(salonId);
    const sittingSales = sittingSubs.reduce((acc, sub) => {
      sub.history.forEach(h => {
        if (h.staffId === staffId && h.type === 'Redemption') {
          const d = new Date(h.date);
          if (d.getMonth() === month && d.getFullYear() === year) {
            // Using sub.unitPrice instead of default lookup to respect manual edits at purchase
            acc += (sub.unitPrice || 0) * 0.6;
          }
        }
      });
      return acc;
    }, 0);

    return invoiceSales + directWalletSales + sittingSales;
  }

  addInvoice(invoice: Invoice) { 
    if (invoice.paymentMode === PaymentMode.PACKAGE) {
      const subs = this.getPackageSubscriptions(invoice.salonId);
      const sub = subs.find(s => s.customerMobile === invoice.customerMobile && s.status === 'Active');
      if (sub) {
        invoice.packagePreviousBalance = sub.currentBalance;
        invoice.packageName = sub.templateName;
        invoice.packagePaidAmount = sub.paidAmount;
        this.deductFromPackage(invoice.customerMobile, invoice.total, invoice.id, invoice.items);
        invoice.packageRemainingBalance = sub.currentBalance;
      }
    }
    this.invoices.unshift(invoice);
    localStorage.setItem('luxe_invoices', JSON.stringify(this.invoices));
  }
  updateStaff(s: Staff) {
    const idx = this.staff.findIndex(item => item.id === s.id);
    if (idx > -1) { this.staff[idx] = s; localStorage.setItem('luxe_staff', JSON.stringify(this.staff)); }
  }
  addStaff(s: Omit<Staff, 'id' | 'salonId'>) {
    const newStaff: Staff = { ...s, id: `st_${Date.now()}`, salonId: this.getActiveSalonId() || 's1' };
    this.staff.push(newStaff);
    localStorage.setItem('luxe_staff', JSON.stringify(this.staff));
  }

  // --- TEMPLATE ONBOARDING LOGIC ---
  onboardSalon(s: Omit<Salon, 'id'>, managerName: string) {
    const id = `s_${Date.now()}`;
    const newSalon = { ...s, id, managerName };
    
    // 1. Create Salon
    this.salons.push(newSalon);
    localStorage.setItem('luxe_salons', JSON.stringify(this.salons));

    // 2. Clone Package Templates for the new outlet
    this.packageTemplates = this.packageTemplates.map(pt => ({
      ...pt,
      salonIds: [...new Set([...pt.salonIds, id])]
    }));
    localStorage.setItem('luxe_pkg_templates', JSON.stringify(this.packageTemplates));

    this.sittingPackageTemplates = this.sittingPackageTemplates.map(st => ({
      ...st,
      salonIds: [...new Set([...st.salonIds, id])]
    }));
    localStorage.setItem('luxe_sit_templates', JSON.stringify(this.sittingPackageTemplates));
    
    // 3. Create initial Policy Voucher for new outlet
    this.vouchers.push({ 
      id: `v_policy_${id}`, 
      code: 'POLICY35', 
      salonId: id, 
      value: 0, 
      balance: 0, 
      status: 'Active' 
    });
    localStorage.setItem('luxe_vouchers', JSON.stringify(this.vouchers));
  }

  updateSalon(id: string, s: Partial<Salon>) {
    const idx = this.salons.findIndex(item => item.id === id);
    if (idx > -1) { 
      this.salons[idx] = { ...this.salons[idx], ...s }; 
      localStorage.setItem('luxe_salons', JSON.stringify(this.salons)); 
    }
  }
  updateAttendance(r: Omit<AttendanceRecord, 'id'>) {
    const idx = this.attendance.findIndex(a => a.staffId === r.staffId && a.date === r.date);
    if (idx > -1) this.attendance[idx] = { ...this.attendance[idx], ...r };
    else this.attendance.push({ id: `att_${Date.now()}`, ...r });
    localStorage.setItem('luxe_attendance', JSON.stringify(this.attendance));
  }

  // --- EXPENSE MANAGEMENT ---
  getExpenses(salonId?: string) {
    const sid = salonId || this.getActiveSalonId();
    if (!sid) {
       if (this.currentUser?.role === UserRole.SUPER_ADMIN) return this.expenses;
       const allowed = this.currentUser?.salonIds || [];
       return this.expenses.filter(e => allowed.includes(e.salonId));
    }
    return this.expenses.filter(e => e.salonId === sid).sort((a,b) => b.date.localeCompare(a.date));
  }

  getLatestExpense(salonId?: string) {
    const sid = salonId || this.getActiveSalonId();
    if (!sid) return this.getExpenses()[0] || null;
    const salonExpenses = this.expenses.filter(e => e.salonId === sid);
    if (salonExpenses.length === 0) return null;
    return salonExpenses.sort((a,b) => b.date.localeCompare(a.date))[0];
  }

  addExpense(e: Omit<Expense, 'id'>) {
    const newExpense = { ...e, id: `exp_${Date.now()}` };
    this.expenses.unshift(newExpense);
    localStorage.setItem('luxe_expenses', JSON.stringify(this.expenses));
    return newExpense;
  }

  // --- P&L STORAGE ---
  getProfitLossRecord(salonId: string, month: number, year: number) {
    return this.plRecords.find(r => r.salonId === salonId && r.month === month && r.year === year) || null;
  }

  saveProfitLossRecord(record: ProfitLossRecord) {
    const idx = this.plRecords.findIndex(r => r.salonId === record.salonId && r.month === record.month && r.year === record.year);
    if (idx > -1) {
      this.plRecords[idx] = record;
    } else {
      this.plRecords.push(record);
    }
    localStorage.setItem('luxe_pl_records', JSON.stringify(this.plRecords));
  }
}

export const dataService = new DataService();