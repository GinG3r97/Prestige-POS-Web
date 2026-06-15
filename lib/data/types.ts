export type TenantOverview = {
  tenant_id: string;
  business_name: string;
  currency: string;
  created_at: string;
  plan: string | null;
  status: string | null;
  current_period_end: string | null;
  price_cents: number;
  billing_cycle: string;
  revenue_today_cents: number;
  orders_today: number;
  revenue_7d_cents: number;
  orders_7d: number;
  revenue_30d_cents: number;
  gross_cents: number;
  last_order_at: string | null;
  open_shift_today: boolean;
  product_count: number;
  category_count: number;
  inventory_count: number;
  low_stock_count: number;
  employee_count: number;
  branch_count: number;
};

export type PaymentRequest = {
  id: string;
  tenant_id: string;
  store_code: string;
  business_name: string;
  email: string;
  requested_plan: string;
  billing_cycle: string;
  amount_cents: number;
  gcash_reference: string;
  status: "pending" | "verified" | "rejected";
  created_at: string;
  verified_at: string | null;
  verified_by: string | null;
  admin_note: string | null;
};

export type Subscription = {
  tenant_id: string;
  plan: string;
  status: string;
  price_cents: number;
  billing_cycle: string;
  started_at: string;
  current_period_end: string | null;
  notes: string | null;
};

export type TenantDetail = {
  tenant: {
    id: string;
    business_name: string;
    address: string | null;
    currency: string;
    timezone: string;
    created_at: string;
    vat_registered: boolean | null;
    tin: string | null;
  };
  subscription: Subscription | null;
  kpis: {
    revenue_today_cents: number;
    orders_today: number;
    revenue_7d_cents: number;
    revenue_30d_cents: number;
    orders_30d: number;
    gross_cents: number;
    orders_total: number;
    avg_ticket_cents: number;
    last_order_at: string | null;
  };
  daily: { d: string; rev: number; orders: number }[];
  payment_mix: { method: string; amount: number; count: number }[];
  top_sellers: { name: string; qty: number; revenue: number }[];
  recent_orders: {
    order_number: number;
    total: number;
    status: string;
    cashier: string | null;
    at: string;
  }[];
  recent_shifts: {
    status: string;
    opened_at: string;
    closed_at: string | null;
    opened_by: string | null;
    total_sales: number | null;
    orders: number | null;
    over_short: number | null;
  }[];
  counts: {
    products: number;
    categories: number;
    inventory: number;
    employees: number;
    branches: number;
    low_stock: number;
  };
  low_stock_items: {
    name: string;
    stock: number;
    threshold: number;
    unit: string | null;
  }[];
  employees: { name: string; status: string | null; role: string | null }[];
};
