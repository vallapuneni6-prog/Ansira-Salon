import { UserRole, PaymentMode, AttendanceStatus, Salon, Staff, Invoice, Service, Voucher, Package } from './types';

export const GST_RATE = 0.05;

export const INITIAL_SALONS: Salon[] = [
  { id: 's1', name: 'Elite Styles Downtown', address: '123 Main St, Central District', contact: '555-0101' },
  { id: 's2', name: 'Glow Up Suburban', address: '456 Oak Ave, West Side', contact: '555-0102' }
];

export const INITIAL_SERVICES: Service[] = [
  { id: 'svc1', name: 'Standard Haircut', category: 'Hair', basePrice: 40 },
  { id: 'svc2', name: 'Hair Coloring', category: 'Hair', basePrice: 120 },
  { id: 'svc3', name: 'Luxury Facial', category: 'Skin', basePrice: 85 },
  { id: 'svc4', name: 'Gel Manicure', category: 'Nails', basePrice: 45 }
];

export const INITIAL_STAFF: Staff[] = [
  { 
    id: 'st1', 
    name: 'Alex Rivera', 
    phone: '9876543210', 
    salonId: 's1', 
    role: 'Staff', 
    salary: 25000, 
    target: 125000, 
    joiningDate: '2023-01-15', 
    status: 'Active' 
  },
  { 
    id: 'st2', 
    name: 'Sarah Chen', 
    phone: '9876543211', 
    salonId: 's1', 
    role: 'Staff', 
    salary: 28000, 
    target: 140000, 
    joiningDate: '2023-03-10', 
    status: 'Active' 
  },
  { 
    id: 'st3', 
    name: 'Jordan Taylor', 
    phone: '9876543212', 
    salonId: 's2', 
    role: 'Manager', 
    salary: 45000, 
    target: 0, 
    joiningDate: '2022-11-05', 
    status: 'Active' 
  },
  { 
    id: 'st4', 
    name: 'Maria Garcia', 
    phone: '9876543213', 
    salonId: 's2', 
    role: 'Staff', 
    salary: 22000, 
    target: 110000, 
    joiningDate: '2023-05-20', 
    status: 'Active' 
  }
];

export const INITIAL_VOUCHERS: Voucher[] = [
  { id: 'v1', code: 'WELCOME10', salonId: 's1', value: 10, balance: 10, status: 'Active' },
  { id: 'v2', code: 'GLOW50', salonId: 's1', value: 50, balance: 50, status: 'Active' }
];

export const INITIAL_PACKAGES: Package[] = [
  { 
    id: 'pkg1', 
    salonId: 's1', 
    name: 'Bridal Glow', 
    price: 250, 
    services: [
      { serviceId: 'svc2', count: 1 },
      { serviceId: 'svc3', count: 2 }
    ] 
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv1',
    salonId: 's1',
    customerName: 'John Doe',
    customerMobile: '9876543210',
    items: [
      { id: 'itm1', serviceName: 'Haircut', price: 50, quantity: 1, staffId: 'st1' }
    ],
    subtotal: 50,
    discount: 0,
    gst: 2.5,
    total: 52.5,
    paymentMode: PaymentMode.UPI,
    date: new Date().toISOString()
  }
];