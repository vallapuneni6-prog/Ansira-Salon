export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER'
}

export enum AttendanceStatus {
  PRESENT = 'Present',
  WEEKOFF = 'Weekoff',
  LEAVE = 'Leave'
}

export enum PaymentMode {
  CASH = 'Cash',
  CARD = 'Card',
  UPI = 'UPI',
  PACKAGE = 'Package Wallet'
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  salonIds?: string[];
}

export interface Salon {
  id: string;
  name: string;
  address: string;
  contact: string;
  gstNumber?: string;
  managerName?: string;
}

export interface Service {
  id: string;
  name: string;
  category: 'Hair' | 'Skin' | 'Spa' | 'Nails';
  basePrice: number;
}

export interface Customer {
  mobile: string;
  name: string;
}

export interface Staff {
  id: string;
  name: string;
  phone?: string;
  salonId: string;
  role: 'Manager' | 'Staff' | 'House Keeping';
  salary?: number;
  target?: number;
  joiningDate?: string;
  exitDate?: string;
  status: 'Active' | 'Inactive';
}

export interface PackageTemplate {
  id: string;
  name: string;
  paidAmount: number;
  offeredValue: number;
  salonIds: string[];
}

export interface SittingPackageTemplate {
  id: string;
  name: string;
  paidSittings: number;
  compSittings: number;
  totalSittings: number;
  salonIds: string[];
}

export interface SittingPackageSubscription {
  id: string;
  salonId: string;
  customerMobile: string;
  customerName: string;
  templateId: string;
  serviceName: string;
  unitPrice: number;
  totalSittings: number;
  sittingsUsed: number;
  remainingSittings: number;
  expiryDate: string;
  status: 'Active' | 'Consumed' | 'Expired';
  paidAmount: number;
  assignedDate: string;
  history: {
    date: string;
    staffId: string;
    staffName: string;
    type: 'Redemption' | 'Activation';
  }[];
}

export interface PackageSubscription {
  id: string;
  salonId: string;
  customerMobile: string;
  customerName: string;
  templateId: string;
  templateName: string;
  initialValue: number;
  currentBalance: number;
  paidAmount: number;
  assignedDate: string;
  expiryDate: string;
  status: 'Active' | 'Expired' | 'FullyConsumed';
  history: {
    date: string;
    amount: number;
    description: string;
    balanceAfter: number;
    items?: { serviceName: string; quantity: number; price: number; staffId?: string }[];
  }[];
}

export interface Package {
  id: string;
  salonId: string;
  name: string;
  price: number;
  services: { serviceId: string; count: number }[];
}

export interface Voucher {
  id: string;
  code: string;
  salonId: string;
  value: number;
  balance: number;
  status: 'Active' | 'Redeemed' | 'Expired';
  customerMobile?: string;
}

// Added ReferralVoucher interface to fix missing type errors in InvoiceForm and VouchersView
export interface ReferralVoucher {
  id: string;
  guestName: string;
  guestMobile: string;
  referringName: string;
  billNo: string;
  validFrom: string;
  validTill: string;
  discount: string;
  status: 'Active' | 'Redeemed' | 'Expired';
  dateIssued: string;
}

export interface InvoiceItem {
  id: string;
  serviceName: string;
  price: number;
  quantity: number;
  staffId: string;
}

export interface Invoice {
  id: string;
  salonId: string;
  customerName: string;
  customerMobile: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  paymentMode: PaymentMode;
  date: string;
  packageUsedId?: string;
  packageName?: string;
  packagePaidAmount?: number;
  packagePreviousBalance?: number;
  packageRemainingBalance?: number;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
}

export interface Expense {
  id: string;
  salonId: string;
  date: string;
  openingBalance: number;
  cashReceived: number;
  category: string;
  expenseAmount: number;
  cashDeposited: number;
  closingBalance: number;
  recordedBy: string;
}

export interface ProfitLossRecord {
  salonId: string;
  month: number;
  year: number;
  rent: number;
  royalty: number;
  gst: number;
  powerBill: number;
  productsBill: number;
  mobileInternet: number;
  laundry: number;
  marketing: number;
  others: number;
}