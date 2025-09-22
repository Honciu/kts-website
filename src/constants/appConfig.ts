export const APP_CONFIG = {
  name: 'Lăcătuș București App',
  version: '1.2.9',
  description: 'Sistem de Management Lucrări',
};

export const DEMO_EMPLOYEES = [
  // Demo employees removed - only real employees from database will be used
];

export const DEMO_ACCOUNTS = {
  admin: {
    id: '123',
    password: '123',
    user: {
      id: '123',
      type: 'admin' as const,
      name: 'Administrator',
      email: 'admin@kts.ro',
      isManager: true,
    }
  }
};
