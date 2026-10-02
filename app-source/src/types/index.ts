export type UserRole = 'MASTER' | 'OWNER' | 'CASHIER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type ShiftStatus = 'OPEN' | 'CLOSED';
export type PaymentMethod = 'CASH' | 'QRIS' | 'DEBIT' | 'CREDIT' | 'TRANSFER';
export type PaymentStatus = 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export interface Business {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  tax_percentage: number;
  service_percentage: number;
  receipt_header: string;
  receipt_footer: string;
  currency_symbol: string;
  status: UserStatus;
}

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  business_id: string | null;
  phone?: string;
  status?: UserStatus;
  last_login_at?: string | null;
}

export interface Category {
  id: string;
  business_id: string;
  name: string;
  icon: string;
  sort_order: number;
}

export interface Product {
  id: string;
  business_id: string;
  category_id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  cost_price: number;
  track_inventory: boolean;
  image_url: string;
  status: UserStatus;
  current_stock?: number;
  min_stock_alert?: number;
}

export interface InventoryItem {
  id: string;
  business_id: string;
  product_id: string;
  current_stock: number;
  min_stock_alert: number;
  unit: string;
  product_name: string;
  sku: string;
  price: number;
  updated_at: string;
}

export interface Shift {
  id: string;
  business_id: string;
  cashier_user_id: string;
  cashier_name: string;
  status: ShiftStatus;
  opened_at: string;
  closed_at: string | null;
  starting_cash: number;
  expected_cash: number;
  actual_cash: number | null;
  cash_difference: number | null;
  notes: string;
  total_transactions: number;
  total_sales_amount: number;
}

export interface TransactionItem {
  id?: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  unit_price: number;
  cost_price?: number;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export interface Transaction {
  id: string;
  invoice_number: string;
  business_id: string;
  shift_id: string | null;
  cashier_user_id: string;
  cashier_name: string;
  customer_name: string;
  order_type: OrderType;
  table_number: string | null;
  subtotal: number;
  tax_amount: number;
  service_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  amount_paid: number;
  change_amount: number;
  notes: string;
  created_at: string;
  items: TransactionItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export interface Expense {
  id: string;
  business_id: string;
  shift_id: string | null;
  user_id: string;
  title: string;
  category: string;
  amount: number;
  notes: string;
  date: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  business_id: string | null;
  user_id: string;
  user_role: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}
