export interface User {
  id: string;
  company_id: string;
  company_name?: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'user';
  active: boolean;
}

export interface Company {
  id: string;
  name: string;
  subdomain?: string;
  logo_url?: string;
  settings?: any;
  active: boolean;
}

export interface Brand {
  id: string;
  company_id: string;
  name: string;
  active: boolean;
}

export interface Category {
  id: string;
  company_id: string;
  name: string;
  active: boolean;
}

export interface Product {
  id: string;
  company_id: string;
  brand_id?: string;
  brand_name?: string;
  category_id?: string;
  category_name?: string;
  name: string;
  category: string;
  unit: string;
  description: string;
  price: number;
  images?: string[]; // Array of base64 strings or URLs
  active: boolean;
}

export interface PriceHistory {
  id: number;
  product_id: string;
  price: number;
  created_at: string;
}

export interface ShoppingList {
  id: string;
  company_id: string;
  company_name?: string;
  user_id: string;
  user_name?: string;
  supplier_id?: string;
  supplier_name?: string;
  created_at: string;
  items?: ShoppingListItem[];
}

export interface ShoppingListItem {
  id: string;
  list_id: string;
  product_id: string;
  product_name?: string;
  unit?: string;
  price?: number;
  quantity: number;
}

export interface Supplier {
  id: string;
  company_id: string;
  corporate_name: string;
  trade_name: string;
  tax_id: string;
  registration: string;
  address: string;
  phone: string;
  email: string;
  rep_name: string;
  description: string;
  active: boolean;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    role: 'superadmin' | 'admin' | 'user';
    company_id: string;
  };
}
