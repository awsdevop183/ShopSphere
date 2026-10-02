export interface Product {
  id: string; slug: string; name: string; description: string;
  price: number; compareAt: number | null; rating: number; featured: boolean;
  category?: { slug: string; name: string }; images: { url: string; alt: string }[]; stock: number;
}
export interface User { id: string; email: string; role: 'CUSTOMER' | 'STAFF' | 'ADMIN' | 'INSTRUCTOR'; firstName: string; lastName: string; }
export interface CartView { items: { productId: string; slug: string; name: string; unitPrice: number; quantity: number; image: string | null; lineTotal: number }[]; subtotal: number; count: number; }
