
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import AdminLogin from './src/components/admin/AdminLogin';
import ToolManager from './src/components/admin/ToolManager';
import CategoryManager from './src/components/admin/CategoryManager';
import AdminLayout from './src/components/admin/AdminLayout';
import { AdminProvider } from './src/contexts/AdminContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin/login" element={
          <AdminProvider>
            <AdminLogin />
          </AdminProvider>
        } />
        <Route path="/admin/tools" element={
          <AdminProvider>
            <AdminLayout activeTab="tools">
              <ToolManager />
            </AdminLayout>
          </AdminProvider>
        } />
        <Route path="/admin/categories" element={
          <AdminProvider>
            <AdminLayout activeTab="categories">
              <CategoryManager />
            </AdminLayout>
          </AdminProvider>
        } />
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
