import { AuthResponse, Product, User, Company, ShoppingList, Brand, Category, PriceHistory, Supplier } from '../types';

const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Request failed with status ${res.status}`);
  }
  return res.json();
};

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(res);
    },
  },
  company: {
    getMe: async (): Promise<Company> => {
      const res = await fetch(`${API_BASE}/company/me`, { headers: getHeaders() });
      return handleResponse(res);
    },
  },
  companies: {
    list: async (): Promise<Company[]> => {
      const res = await fetch(`${API_BASE}/companies`, { headers: getHeaders() });
      return handleResponse(res);
    },
    create: async (data: Partial<Company>): Promise<Company> => {
      const res = await fetch(`${API_BASE}/companies`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    update: async (id: string, data: Partial<Company>): Promise<void> => {
      const res = await fetch(`${API_BASE}/companies/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      await handleResponse(res);
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/companies/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      await handleResponse(res);
    },
  },
  brands: {
    list: async (): Promise<Brand[]> => {
      const res = await fetch(`${API_BASE}/brands`, { headers: getHeaders() });
      return handleResponse(res);
    },
    create: async (data: Partial<Brand>): Promise<Brand> => {
      const res = await fetch(`${API_BASE}/brands`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    update: async (id: string, data: Partial<Brand>): Promise<void> => {
      const res = await fetch(`${API_BASE}/brands/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      await handleResponse(res);
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/brands/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      await handleResponse(res);
    },
  },
  categories: {
    list: async (): Promise<Category[]> => {
      const res = await fetch(`${API_BASE}/categories`, { headers: getHeaders() });
      return handleResponse(res);
    },
    create: async (data: Partial<Category>): Promise<Category> => {
      const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    update: async (id: string, data: Partial<Category>): Promise<void> => {
      const res = await fetch(`${API_BASE}/categories/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      await handleResponse(res);
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/categories/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      await handleResponse(res);
    },
  },
  products: {
    list: async (): Promise<Product[]> => {
      const res = await fetch(`${API_BASE}/products`, { headers: getHeaders() });
      return handleResponse(res);
    },
    create: async (data: Partial<Product>): Promise<Product> => {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    update: async (id: string, data: Partial<Product>): Promise<void> => {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      await handleResponse(res);
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      await handleResponse(res);
    },
    getPriceHistory: async (id: string): Promise<PriceHistory[]> => {
      const res = await fetch(`${API_BASE}/products/${id}/price-history`, { headers: getHeaders() });
      return handleResponse(res);
    },
  },
  users: {
    list: async (): Promise<User[]> => {
      const res = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
      return handleResponse(res);
    },
    create: async (data: any): Promise<User> => {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    update: async (id: string, data: Partial<User>): Promise<void> => {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      await handleResponse(res);
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      await handleResponse(res);
    },
  },
  lists: {
    create: async (items: { product_id: string; quantity: number }[], supplier_id?: string): Promise<{ id: string }> => {
      const res = await fetch(`${API_BASE}/lists`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ items, supplier_id }),
      });
      return handleResponse(res);
    },
    list: async (): Promise<ShoppingList[]> => {
      const res = await fetch(`${API_BASE}/lists`, { headers: getHeaders() });
      return handleResponse(res);
    },
    get: async (id: string): Promise<ShoppingList> => {
      const res = await fetch(`${API_BASE}/lists/${id}`, { headers: getHeaders() });
      return handleResponse(res);
    },
  },
  suppliers: {
    list: async (): Promise<Supplier[]> => {
      const res = await fetch(`${API_BASE}/suppliers`, { headers: getHeaders() });
      return handleResponse(res);
    },
    create: async (data: Partial<Supplier>): Promise<Supplier> => {
      const res = await fetch(`${API_BASE}/suppliers`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    update: async (id: string, data: Partial<Supplier>): Promise<void> => {
      const res = await fetch(`${API_BASE}/suppliers/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      await handleResponse(res);
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/suppliers/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      await handleResponse(res);
    },
  },
};
