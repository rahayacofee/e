const API_BASE = '/api';

function getAuthToken(): string | null {
  return localStorage.getItem('rahaya_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('rahaya_token', token);
  } else {
    localStorage.removeItem('rahaya_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `Error ${response.status}: Permintaan gagal diproses.`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    request<{ token: string; user: any; business: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getMe: () => request<{ user: any; business: any; open_shift: any }>('/auth/me'),

  changePassword: (passwords: { old_password: string; new_password: string }) =>
    request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwords),
    }),

  // Master
  master: {
    getDashboard: () => request<{ summary: any; recent_owners: any[] }>('/master/dashboard'),
    getOwners: () => request<{ owners: any[] }>('/master/owners'),
    createOwner: (data: any) =>
      request<{ message: string; owner: any; business: any }>('/master/owners', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateOwner: (id: string, data: any) =>
      request<{ message: string; owner: any }>(`/master/owners/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    toggleOwnerStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') =>
      request<{ message: string; status: string }>(`/master/owners/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    resetOwnerPassword: (id: string, new_password: string) =>
      request<{ message: string }>(`/master/owners/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ new_password }),
      }),
    getAuditLogs: () => request<{ logs: any[] }>('/master/audit-logs'),
    getDatabaseStatus: () => request<any>('/master/database-status'),
  },

  // Owner
  owner: {
    getDashboard: () => request<any>('/owner/dashboard'),
    getProducts: () => request<{ products: any[]; categories: any[] }>('/owner/products'),
    createProduct: (data: any) =>
      request<{ message: string; product: any }>('/owner/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateProduct: (id: string, data: any) =>
      request<{ message: string; product: any }>(`/owner/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteProduct: (id: string) =>
      request<{ message: string }>(`/owner/products/${id}`, {
        method: 'DELETE',
      }),
    getCategories: () => request<{ categories: any[] }>('/owner/categories'),
    createCategory: (data: { name: string; icon?: string }) =>
      request<{ category: any }>('/owner/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getStock: () => request<{ inventory: any[] }>('/owner/stock'),
    adjustStock: (data: { product_id: string; type: 'IN' | 'OUT' | 'ADJUSTMENT'; amount: number; notes?: string }) =>
      request<{ message: string; inventory: any }>('/owner/stock/adjust', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getCashiers: () => request<{ cashiers: any[] }>('/owner/cashiers'),
    createCashier: (data: any) =>
      request<{ message: string; cashier: any }>('/owner/cashiers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateCashier: (id: string, data: any) =>
      request<{ message: string; cashier: any }>(`/owner/cashiers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    toggleCashierStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') =>
      request<{ message: string }>(`/owner/cashiers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    resetCashierPassword: (id: string, new_password: string) =>
      request<{ message: string }>(`/owner/cashiers/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ new_password }),
      }),
    getShifts: () => request<{ shifts: any[] }>('/owner/shifts'),
    getTransactions: () => request<{ transactions: any[] }>('/owner/transactions'),
    getExpenses: () => request<{ expenses: any[] }>('/owner/expenses'),
    createExpense: (data: any) =>
      request<{ message: string; expense: any }>('/owner/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteExpense: (id: string) =>
      request<{ message: string }>(`/owner/expenses/${id}`, {
        method: 'DELETE',
      }),
    getReports: (params: Record<string, string> = {}) => {
      const query = new URLSearchParams(params).toString();
      return request<any>(`/owner/reports${query ? `?${query}` : ''}`);
    },
    getSettings: () => request<{ business: any }>('/owner/settings'),
    updateSettings: (data: any) =>
      request<{ message: string; business: any }>('/owner/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Cashier
  cashier: {
    getCurrentShift: () => request<{ shift: any; has_open_shift: boolean }>('/cashier/shift/current'),
    openShift: (data: { starting_cash: number; notes?: string }) =>
      request<{ message: string; shift: any }>('/cashier/shift/open', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    closeShift: (data: { actual_cash: number; notes?: string }) =>
      request<{ message: string; shift: any }>('/cashier/shift/close', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMyTransactions: () => request<{ transactions: any[] }>('/cashier/transactions'),
    getReports: (params: Record<string, string> = {}) => {
      const query = new URLSearchParams(params).toString();
      return request<any>(`/cashier/reports${query ? `?${query}` : ''}`);
    },
    getProfile: () => request<{ user: any; business: any }>('/cashier/profile'),
  },

  // POS
  pos: {
    getInitData: () => request<{ business: any; categories: any[]; products: any[]; active_shift: any }>('/pos/init'),
    createTransaction: (data: any) =>
      request<{ message: string; transaction: any; receipt: any }>('/pos/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Database
  database: {
    getStatus: () => request<any>('/database/status'),
    configure: (data: { supabase_url: string; supabase_key: string }) =>
      request<{ message: string; test_result: any }>('/database/configure', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    test: () => request<{ connected: boolean; message: string }>('/database/test', { method: 'POST' }),
    syncAll: () => request<{ success: boolean; message: string; counts: any }>('/database/sync-all', { method: 'POST' }),
    getSchemaSql: async () => {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/database/schema-sql`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.text();
    },
  },
};
