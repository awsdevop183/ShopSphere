import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { useAuth } from './lib/auth.tsx';
import type { ReactNode } from 'react';

import Home from './pages/Home.tsx';
import Products from './pages/Products.tsx';
import ProductDetail from './pages/ProductDetail.tsx';
import SearchPage from './pages/Search.tsx';
import Cart from './pages/Cart.tsx';
import Checkout from './pages/Checkout.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Content from './pages/Content.tsx';
import TrackOrder from './pages/TrackOrder.tsx';
import AccountLayout from './pages/account/AccountLayout.tsx';
import Orders from './pages/account/Orders.tsx';
import OrderDetail from './pages/account/OrderDetail.tsx';
import Profile from './pages/account/Profile.tsx';
import Wishlist from './pages/account/Wishlist.tsx';
import Support from './pages/account/Support.tsx';
import AdminLayout from './pages/admin/AdminLayout.tsx';
import Dashboard from './pages/admin/Dashboard.tsx';
import AdminProducts from './pages/admin/Products.tsx';
import AdminOrders from './pages/admin/Orders.tsx';
import AdminCustomers from './pages/admin/Customers.tsx';
import Instructor from './pages/instructor/Instructor.tsx';
import Labs from './pages/Labs.tsx';
import Findings from './pages/Findings.tsx';
import RequestInspector from './pages/RequestInspector.tsx';

function Protected({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="container-x py-20 text-center text-ink-soft">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <div className="container-x py-20"><div className="card p-10 text-center"><p className="text-lg font-semibold">Access denied</p><p className="text-ink-soft mt-2">Your account role does not have access to this area.</p></div></div>;
  return <>{children}</>;
}

export default function App() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <CartDrawer />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/categories/:slug" element={<Products />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/deals" element={<Products preset="deals" />} />
          <Route path="/new-arrivals" element={<Products preset="new" />} />
          <Route path="/best-sellers" element={<Products preset="best" />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Protected><Checkout /></Protected>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/track-order" element={<TrackOrder />} />
          {['about','contact','help','faq','shipping','returns','privacy','terms'].map((p) => (
            <Route key={p} path={`/${p}`} element={<Content slug={p} />} />
          ))}

          <Route path="/account" element={<Protected><AccountLayout /></Protected>}>
            <Route index element={<Profile />} />
            <Route path="profile" element={<Profile />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="support" element={<Support />} />
          </Route>

          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin" element={<Protected roles={['ADMIN','STAFF']}><AdminLayout /></Protected>}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
          </Route>

          <Route path="/instructor" element={<Protected roles={['INSTRUCTOR']}><Instructor /></Protected>} />

          {/* Student security-lab tools */}
          <Route path="/labs" element={<Protected><Labs /></Protected>} />
          <Route path="/labs/findings" element={<Protected><Findings /></Protected>} />
          <Route path="/labs/inspector" element={<Protected><RequestInspector /></Protected>} />

          <Route path="*" element={<div className="container-x py-24 text-center"><h1 className="text-3xl font-bold">404</h1><p className="text-ink-soft mt-2">That page could not be found.</p></div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
