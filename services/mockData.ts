import { Salon, Staff, Invoice, AttendanceRecord, User, UserRole, Service, Voucher, Customer, PackageTemplate, PackageSubscription, PaymentMode, SittingPackageTemplate, SittingPackageSubscription, Expense, ProfitLossRecord, ReferralVoucher } from '../types';

// Exporting ReferralVoucher to fix the error where components expect it from this module
export type { ReferralVoucher };

// Points to your Express backend
const API_URL = 'http://localhost:3001/api';

class DataService {
  private currentUser: User | null = null;
  private activeSalonId: string | null = null;
  private isUsingBackend: boolean = true;

  constructor() {
    this.init();
  }

  private init() {
    const savedUser = localStorage.getItem('luxe_user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      if (this.currentUser?.salonIds?.length && this.currentUser.role === UserRole.MANAGER) {
        this.activeSalonId = this.currentUser.salonIds[0];
      }
    }
  }

  async login(username: string, password: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (response.ok) {
        const user = await response.json();
        this.currentUser = user;
        localStorage.setItem('luxe_user', JSON.stringify(this.currentUser));
        return user;
      }
    } catch (err) {
      console.error('Login error:', err);
    }
    
    // Local fallback for super admin
    if (username === 'super' && password === '123') {
      this.currentUser = { id: 'u_super', name: 'Global CEO', username: 'super', role: UserRole.SUPER_ADMIN };
      localStorage.setItem('luxe_user', JSON.stringify(this.currentUser));
      return this.currentUser;
    }
    return null;
  }

  async logout() {
    this.currentUser = null;
    this.activeSalonId = null;
    localStorage.removeItem('luxe_user');
  }

  getCurrentUser() { return this.currentUser; }
  getActiveSalonId() { return this.activeSalonId; }
  setActiveSalonId(id: string | null) { this.activeSalonId = id; }
  
  async getActiveSalon(): Promise<Salon | undefined> {
    if (!this.activeSalonId) return undefined;
    const salons = await this.getSalons();
    return salons.find(s => s.id === this.activeSalonId);
  }

  async getSalons(): Promise<Salon[]> {
    try {
      const response = await fetch(`${API_URL}/salons`);
      return await response.json();
    } catch (err) {
      return JSON.parse(localStorage.getItem('luxe_salons') || '[]');
    }
  }

  async updateSalon(id: string, d: Partial<Salon>) {
    // Logic for updating via API
  }

  async onboardSalon(data: Omit<Salon, 'id'>, managerName: string) {
    const id = `s_${Date.now()}`;
    await fetch(`${API_URL}/salons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, id, manager_name: managerName })
    });
  }

  async getStaff(salonId?: string): Promise<Staff[]> {
    const sid = salonId || this.activeSalonId;
    try {
      const url = sid ? `${API_URL}/staff?salonId=${sid}` : `${API_URL}/staff`;
      const response = await fetch(url);
      return await response.json();
    } catch (err) {
      return [];
    }
  }

  async addStaff(s: Omit<Staff, 'id' | 'salonId'>) {
    const salonId = this.activeSalonId || 's1';
    const id = `st_${Date.now()}`;
    await fetch(`${API_URL}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...s, id, salonId })
    });
  }

  async updateStaff(s: Staff) {
    // Logic for updating via API
  }

  async getInvoices(salonId?: string): Promise<Invoice[]> {
    const sid = salonId || this.activeSalonId;
    try {
      const url = sid ? `${API_URL}/invoices?salonId=${sid}` : `${API_URL}/invoices`;
      const response = await fetch(url);
      return await response.json();
    } catch (err) {
      return [];
    }
  }

  async addInvoice(invoice: Invoice) {
    await fetch(`${API_URL}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice)
    });
  }

  async getCustomers(): Promise<Customer[]> {
    const response = await fetch(`${API_URL}/customers`);
    return await response.json();
  }

  async findCustomer(mobile: string): Promise<Customer | undefined> {
    const customers = await this.getCustomers();
    return customers.find(c => c.mobile === mobile);
  }

  async saveCustomer(customer: Customer) {
    await fetch(`${API_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer)
    });
  }

  async getAttendance(date: string, salonId: string | null): Promise<AttendanceRecord[]> {
    const response = await fetch(`${API_URL}/attendance?date=${date}`);
    return await response.json();
  }

  async updateAttendance(record: AttendanceRecord) {
    await fetch(`${API_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
  }

  async getMonthlyAttendanceStats(staffId: string, month: number, year: number) {
    // Basic implementation
    return { present: 0, lopDays: 0, extraHours: 0, effectiveDeductionDays: 0 };
  }

  async calculateStaffSales(staffId: string, month: number, year: number): Promise<number> {
    return 0;
  }

  // Updated signature to return ReferralVoucher array
  async getVouchersByMobile(mobile: string): Promise<{ system: Voucher[], referrals: ReferralVoucher[] }> {
    return { system: [], referrals: [] };
  }

  // Updated signature to return ReferralVoucher array
  async getReferralVouchers(): Promise<ReferralVoucher[]> {
    return [];
  }

  // Updated signature to use ReferralVoucher type
  async addReferralVoucher(v: ReferralVoucher) {}

  async getPackageTemplates(): Promise<PackageTemplate[]> {
    return [];
  }

  async addPackageTemplate(t: Omit<PackageTemplate, 'id'>) {}

  async deletePackageTemplate(id: string) {}

  async getSittingPackageTemplates(): Promise<SittingPackageTemplate[]> {
    return [];
  }

  async addSittingPackageTemplate(t: Omit<SittingPackageTemplate, 'id'>) {}

  async deleteSittingPackageTemplate(id: string) {}

  async getPackageSubscriptions(salonId?: string): Promise<PackageSubscription[]> {
    return [];
  }

  async addPackageSubscription(sub: PackageSubscription) {}

  async deductFromPackage(mobile: string, amount: number, id: string, items: any[]) {
    return null;
  }

  async getSittingPackageSubscriptions(salonId?: string): Promise<SittingPackageSubscription[]> {
    return [];
  }

  async addSittingPackageSubscription(sub: SittingPackageSubscription) {}

  async redeemSittingPackage(id: string, staffId: string, staffName: string) {
    return null;
  }

  async getExpenses(salonId?: string): Promise<Expense[]> {
    return [];
  }

  async getLatestExpense(salonId: string | null): Promise<Expense | null> {
    return null;
  }

  async addExpense(e: Omit<Expense, 'id'>) {}

  async getServices(): Promise<Service[]> {
    return [];
  }

  async addService(s: Omit<Service, 'id'>) {}

  async updateService(s: Service) {}

  async deleteService(id: string) {}

  async getProfitLossRecord(salonId: string, month: number, year: number) {
    return null;
  }

  async saveProfitLossRecord(record: ProfitLossRecord) {}

  async getAdmins(): Promise<User[]> {
    return [];
  }

  async addAdmin(u: any) {}

  async getManagers(): Promise<User[]> {
    return [];
  }

  async addManager(u: any) {}

  async updateUser(id: string, d: Partial<User>) {}

  async deleteUser(id: string) {}

  async deleteCustomer(mobile: string) {}

  async bulkAddCustomers(list: Customer[]) {}
}

export const dataService = new DataService();