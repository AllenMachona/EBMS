import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import BidderRegister from './pages/BidderRegister.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NewProcurement from './pages/Procurements/NewProcurement.jsx';
import ProcurementDetail from './pages/Procurements/ProcurementDetail.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<BidderRegister />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/procurements/new"
        element={
          <ProtectedRoute allowRoles={['PROCUREMENT_UNIT', 'USER_DEPARTMENT']}>
            <Layout><NewProcurement /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/procurements/:id"
        element={
          <ProtectedRoute>
            <Layout><ProcurementDetail /></Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
