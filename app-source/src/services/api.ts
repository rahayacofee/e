const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Supabase belum dikonfigurasi. Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY tersedia.');
}

const API_URL = `${SUPABASE_URL}/functions/v1/rahaya-api`;
// Rahaya custom session token; Supabase Auth is intentionally not used.
const TOKEN_KEY = 'rahaya_app_token';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, method = 'GET', body: any = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string,string> = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_PUBLISHABLE_KEY,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(API_URL, { method, headers, body: JSON.stringify({ path, method, body }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error) throw new Error(data?.error || `Server Rahaya mengembalikan HTTP ${response.status}.`);
  return data as T;
}

export const api = {
  login: async (credentials: { username: string; password: string }) => {
    const result = await request<any>('/auth/login', 'POST', credentials);
    setAuthToken(result.token);
    return result;
  },
  getMe: () => request<{ user: any; business: any; open_shift: any }>('/auth/me'),
  changePassword: (passwords: { old_password: string; new_password: string }) =>
    request<{ success: boolean; message: string }>('/auth/change-password', 'POST', passwords),

  master: {
    getDashboard: () => request<any>('/master/dashboard'),
    getOwners: () => request<any>('/master/owners'),
    getBusinesses: () => request<any>('/master/businesses'),
    createOwner: (data: any) => request<any>('/master/owners', 'POST', data),
    updateOwner: (id: string, data: any) => request<any>(`/master/owners/${id}`, 'PUT', data),
    toggleOwnerStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') =>
      request<any>(`/master/owners/${id}/status`, 'PATCH', { status }),
    resetOwnerPassword: (id: string, new_password: string) =>
      request<any>(`/master/owners/${id}/reset-password`, 'POST', { new_password }),
    getAuditLogs: () => request<any>('/master/audit-logs'),
    getDatabaseStatus: () => request<any>('/database/status'),
  },

  owner: {
    getDashboard: () => request<any>('/owner/dashboard'),
    getProducts: () => request<any>('/owner/products'),
    createProduct: (data: any) => request<any>('/owner/products', 'POST', data),
    updateProduct: (id: string, data: any) => request<any>(`/owner/products/${id}`, 'PUT', data),
    deleteProduct: (id: string) => request<any>(`/owner/products/${id}`, 'DELETE'),
    getCategories: () => request<any>('/owner/categories'),
    createCategory: (data: any) => request<any>('/owner/categories', 'POST', data),
    getStock: () => request<any>('/owner/stock'),
    adjustStock: (data: any) => request<any>('/owner/stock/adjust', 'POST', data),
    getCashiers: () => request<any>('/owner/cashiers'),
    createCashier: (data: any) => request<any>('/owner/cashiers', 'POST', data),
    updateCashier: (id: string, data: any) => request<any>(`/owner/cashiers/${id}`, 'PUT', data),
    toggleCashierStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') =>
      request<any>(`/owner/cashiers/${id}/status`, 'PATCH', { status }),
    resetCashierPassword: (id: string, new_password: string) =>
      request<any>(`/owner/cashiers/${id}/reset-password`, 'POST', { new_password }),
    getShifts: () => request<any>('/owner/shifts'),
    getTransactions: () => request<any>('/owner/transactions'),
    getExpenses: () => request<any>('/owner/expenses'),
    createExpense: (data: any) => request<any>('/owner/expenses', 'POST', data),
    deleteExpense: (id: string) => request<any>(`/owner/expenses/${id}`, 'DELETE'),
    getReports: (params: Record<string, string> = {}) =>
      request<any>('/owner/reports' + (Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '')),
    getSettings: () => request<any>('/owner/settings'),
    updateSettings: (data: any) => request<any>('/owner/settings', 'PUT', data),
  },

  cashier: {
    getCurrentShift: () => request<any>('/cashier/shift/current'),
    openShift: (data: any) => request<any>('/cashier/shift/open', 'POST', data),
    closeShift: (data: any) => request<any>('/cashier/shift/close', 'POST', data),
    getMyTransactions: () => request<any>('/cashier/transactions'),
    getReports: (params: Record<string, string> = {}) =>
      request<any>('/cashier/reports' + (Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '')),
    getProfile: () => request<any>('/cashier/profile'),
  },

  pos: {
    getInitData: () => request<any>('/pos/init'),
    createTransaction: (data: any) => request<any>('/pos/transactions', 'POST', data),
  },

  database: {
    getStatus: () => request<any>('/database/status'),
    configure: async (_data: { supabase_url: string; supabase_key: string }) => ({
      message: 'Rahaya POS sudah terhubung ke Supabase Cloud.',
      test_result: { connected: true, message: 'Supabase Cloud aktif.' },
    }),
    test: () => request<any>('/database/test', 'POST'),
    syncAll: async () => ({ success: true, message: 'Data utama menggunakan Supabase Cloud.', counts: {} }),
    getSchemaSql: async () => '-- Schema Rahaya POS dikelola pada Supabase Cloud.',
  },
};

export async function getSyncVersion() {
  const result = await request<{ version: number; updated_at?: string | null }>('/sync/version');
  return Number(result.version || 0);
}

export function startRealtimeSync(_businessId: string | null, _isMaster = false) {
  let stopped = false;
  let timer: number | null = null;
  let lastVersion: number | null = null;

  const check = async () => {
    if (stopped || !getAuthToken()) return;
    try {
      const version = await getSyncVersion();
      if (lastVersion === null) {
        lastVersion = version;
      } else if (version !== lastVersion) {
        lastVersion = version;
        window.dispatchEvent(new CustomEvent('rahaya-data-changed', { detail: { version } }));
      }
    } catch {
      // Network sementara putus: jangan logout. Percobaan berikutnya akan otomatis jalan.
    } finally {
      if (!stopped) timer = window.setTimeout(check, 3000);
    }
  };

  void check();
  return () => {
    stopped = true;
    if (timer !== null) window.clearTimeout(timer);
  };
}
