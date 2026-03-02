const API_BASE = '/api/v1';

// Paginated response type from DRF
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function getAuthHeadersForForm(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  
  const text = await res.text();
  let data: any = {};
  
  if (text && text.trim()) {
    if (isJson || text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          throw new Error(`Server returned HTML instead of JSON. This usually means the API endpoint doesn't exist or there's a server error. Status: ${res.status}`);
        }
        throw new Error(`Invalid JSON response: ${res.status} ${res.statusText}`);
      }
    } else {
      if (!res.ok) {
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          throw new Error(`Server returned HTML error page. Status: ${res.status}. Please check if the API endpoint exists.`);
        }
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }
      throw new Error(`Expected JSON but received ${contentType}`);
    }
  }
  
  if (!res.ok) {
    const err = data as { error?: string; email?: string[]; password?: string[] };
    throw new Error(
      err?.error ||
        (Array.isArray(err?.email) ? err.email[0] : undefined) ||
        (Array.isArray(err?.password) ? err.password[0] : undefined) ||
        `${res.status} ${res.statusText}`
    );
  }
  return data as T;
}

export const authApi = {
  register: (email: string, password: string) =>
    fetch(`${API_BASE}/accounts/register/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, password }),
    }).then(handleResponse<{ message: string; user_id: string }>),

  login: (email: string, password: string) =>
    fetch(`${API_BASE}/accounts/login/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, password }),
    }).then(handleResponse<{ token: string; role: string; email?: string; organization_name?: string }>),

  profile: () =>
    fetch(`${API_BASE}/accounts/profile/`, { headers: getAuthHeaders() }).then(
      handleResponse<{ id: string; email: string; role: string; organization: string | null; created_at: string | null }>
    ),
};


export const productsApi = {
  list: (search?: string) => {
    const url = search ? `${API_BASE}/products/public/?search=${encodeURIComponent(search)}` : `${API_BASE}/products/public/`;
    return fetch(url, { headers: getAuthHeaders() })
      .then(handleResponse<PaginatedResponse<Product>>)
      .then(res => res.results);
  },
  get: (productId: string) =>
    fetch(`${API_BASE}/products/public/${productId}/`, { headers: getAuthHeaders() }).then(
      handleResponse<Product>
    ),
  getRelated: (productId: string) =>
    fetch(`${API_BASE}/products/public/${productId}/related/`, { headers: getAuthHeaders() }).then(
      handleResponse<Product[]>
    ),
  getMediaUrl: (path: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return normalized.startsWith('/media') ? normalized : `/media/${path.replace(/^\/+/, '')}`;
  },
};

export interface CreateProductForm {
  name: string;
  description: string;
  price: string;
  discount_price?: string;
  stock?: number;
  sku?: string;
  thumbnail?: File;
  manufacturer?: string;
  material?: string;
  product_type?: string;
}

export const adminProductsApi = {
  list: () =>
    fetch(`${API_BASE}/products/admin-list/`, { headers: getAuthHeaders() })
      .then(handleResponse<PaginatedResponse<Product>>)
      .then(res => res.results),
  create: (form: CreateProductForm) => {
    const body = new FormData();
    body.append('name', form.name);
    body.append('description', form.description);
    body.append('price', form.price);
    if (form.discount_price !== undefined && form.discount_price !== '')
      body.append('discount_price', form.discount_price);
    if (form.stock !== undefined) body.append('stock', String(form.stock));
    if (form.sku !== undefined && form.sku !== '') body.append('sku', form.sku);
    if (form.manufacturer !== undefined && form.manufacturer !== '') body.append('manufacturer', form.manufacturer);
    if (form.material !== undefined && form.material !== '') body.append('material', form.material);
    if (form.product_type !== undefined && form.product_type !== '') body.append('product_type', form.product_type);
    if (form.thumbnail) body.append('thumbnail', form.thumbnail);
    return fetch(`${API_BASE}/products/create/`, {
      method: 'POST',
      headers: getAuthHeadersForForm(),
      body,
    }).then(handleResponse<{ message: string; product: { id: string; name: string; price: string; stock: number } }>);
  },
  edit: (productId: string, form: Partial<CreateProductForm>) => {
    const body = new FormData();
    if (form.name !== undefined) body.append('name', form.name);
    if (form.description !== undefined) body.append('description', form.description);
    if (form.price !== undefined) body.append('price', form.price);
    if (form.discount_price !== undefined) body.append('discount_price', form.discount_price);
    if (form.stock !== undefined) body.append('stock', String(form.stock));
    if (form.sku !== undefined) body.append('sku', form.sku);
    if (form.manufacturer !== undefined) body.append('manufacturer', form.manufacturer);
    if (form.material !== undefined) body.append('material', form.material);
    if (form.product_type !== undefined) body.append('product_type', form.product_type);
    if (form.thumbnail) body.append('thumbnail', form.thumbnail);
    return fetch(`${API_BASE}/products/edit/${productId}/`, {
      method: 'PATCH',
      headers: getAuthHeadersForForm(),
      body,
    }).then(handleResponse<{ message: string; data: Product }>);
  },
  approve: (productId: string) =>
    fetch(`${API_BASE}/products/approve/${productId}/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse<{ message: string }>),
  delete: (productId: string) =>
    fetch(`${API_BASE}/products/delete/${productId}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(handleResponse<{ message: string }>),
};

// Cart
export const cartApi = {
  view: () =>
    fetch(`${API_BASE}/cart/view/`, { headers: getAuthHeaders() }).then(
      handleResponse<CartViewResponse>
    ),
  add: (product_id: string, quantity = 1) =>
    fetch(`${API_BASE}/cart/add/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ product_id, quantity }),
    }).then(handleResponse<{ message: string; current_quantity: number; subtotal: string }>),
  updateItem: (itemId: string, quantity: number) =>
    fetch(`${API_BASE}/cart/item/${itemId}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ quantity }),
    }).then(handleResponse<{ message: string; quantity: number; subtotal: string }>),
  removeItem: (itemId: string) =>
    fetch(`${API_BASE}/cart/item/${itemId}/`, { method: 'DELETE', headers: getAuthHeaders() }).then(
      (r) => (r.status === 204 ? {} : r.json().then(handleResponse))
    ),
};

// Addresses
export const addressApi = {
  list: () =>
    fetch(`${API_BASE}/address/create/`, { headers: getAuthHeaders() })
      .then(handleResponse<PaginatedResponse<Address>>)
      .then(res => res.results),
  create: (body: Omit<Address, 'id' | 'user' | 'created_at'>) =>
    fetch(`${API_BASE}/address/create/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse<Address>),
  update: (id: string, body: Partial<Address>) =>
    fetch(`${API_BASE}/address/${id}/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse<Address>),
  delete: (id: string) =>
    fetch(`${API_BASE}/address/${id}/`, { method: 'DELETE', headers: getAuthHeaders() }).then(
      (r) => (r.status === 204 ? {} : r.json())
    ),
};

export const ordersApi = {
  place: (address_id?: string, payment_method: string = 'CASH_ON_DELIVERY') =>
    fetch(`${API_BASE}/orders/place/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ address_id, payment_method }),
    }).then(handleResponse<{ message: string; order: Order }>),
  history: () =>
    fetch(`${API_BASE}/orders/history/`, { headers: getAuthHeaders() })
      .then(handleResponse<PaginatedResponse<OrderListItem>>)
      .then(res => ({ orders: res.results })),
};

export const adminOrdersApi = {
  list: () =>
    fetch(`${API_BASE}/orders/admin/list/`, { headers: getAuthHeaders() })
      .then(handleResponse<PaginatedResponse<OrderListItem>>)
      .then(res => ({ orders: res.results })),
  updateStatus: (orderId: string, status: string) =>
    fetch(`${API_BASE}/orders/admin/update-status/${orderId}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    }).then(handleResponse<{ message: string; current_status: string }>),
};

export const wishlistApi = {
  list: () =>
    fetch(`${API_BASE}/wishlist/view/`, { headers: getAuthHeaders() }).then(
      handleResponse<WishlistItem[]>
    ),
  add: (product_id: string) =>
    fetch(`${API_BASE}/wishlist/add/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ product_id }),
    }).then(handleResponse<{ message: string }>),
  remove: (product_id: string) =>
    fetch(`${API_BASE}/wishlist/remove/${product_id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then((r) => (r.status === 204 ? {} : r.json())),
};

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  discount_price?: string | null;
  thumbnail: string | null;
  stock: number;
  sku?: string | null;
  is_in_stock: boolean;
  is_approved: boolean;
  images?: { id: string; image: string; alt_text?: string }[];
  organization?: string;
  created_at?: string;
  manufacturer?: string | null;
  material?: string | null;
  product_type?: string | null;
}

export interface CartItemView {
  id: string;
  product_id: string;
  product_name: string;
  product_thumbnail: string | null;
  unit_price: string;
  original_price: string;
  quantity: number;
  subtotal: string;
  stock_available: number;
  is_stock_problem: boolean;
}

export interface CartViewResponse {
  cart_id: string;
  total_price: string;
  total_items_count: number;
  items: CartItemView[];
}

export interface Address {
  id: string;
  user?: string;
  full_name: string;
  phone_number: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at?: string;
}

export interface OrderItem {
  product_name: string;
  product_sku?: string;
  price: string;
  quantity: number;
  subtotal: string;
}

export interface Order {
  id: string;
  user: string;
  total_amount: string;
  status: string;
  shipping_address: Address;
  items: OrderItem[];
  created_at: string;
  payment_method?: string;
  is_paid?: boolean;
}

export interface OrderListItem {
  id: string;
  created_at: string;
  total_amount: string;
  status: string;
  product_names: string[];
}

export interface WishlistItem {
  id: string;
  product: string;
  product_name: string;
  product_price: string;
  added_at: string;
}
