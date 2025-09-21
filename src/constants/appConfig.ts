export const APP_CONFIG = {
  name: 'Lăcătuș București App',
  version: '1.2.9',
  description: 'Sistem de Management Lucrări',
};

export const DEMO_EMPLOYEES = [
  {
    id: '1',
    name: 'Robert',
    username: 'Robert',
    phone: '+40712345678',
    email: 'robert@lacatus.ro',
    password: 'Robert1',
    salaryPercentage: 30,
    isActive: true,
    isOnDuty: false
  },
  {
    id: '2',
    name: 'Demo User',
    username: 'demo',
    phone: '+40721000000',
    email: 'demo@lacatus.ro',
    password: 'demo123',
    salaryPercentage: 25,
    isActive: true,
    isOnDuty: false
  },
  {
    id: '3',
    name: 'Lacatus 01',
    username: 'lacatus01',
    phone: '+40731000000',
    email: 'lacatus01@lacatus.ro',
    password: 'worker123',
    salaryPercentage: 28,
    isActive: true,
    isOnDuty: false
  }
];

export const DEMO_ACCOUNTS = {
  admin: {
    id: 'admin',
    password: 'admin123',
    user: {
      id: 'admin',
      type: 'admin' as const,
      name: 'Administrator',
      email: 'admin@lacatus.ro',
      isManager: false,
    }
  },
  manager: {
    id: 'manager',
    password: 'manager123',
    user: {
      id: 'manager',
      type: 'admin' as const,
      name: 'Manager',
      email: 'manager@lacatus.ro',
      isManager: true,
    }
  }
};