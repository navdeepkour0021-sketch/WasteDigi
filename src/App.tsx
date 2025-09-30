import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddInventory from './pages/AddInventory';
import WastePage from './pages/WastePage';
import UsersPage from './pages/UsersPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/inventory" element={
              <ProtectedRoute>
                <Layout>
                  <AddInventory />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/waste" element={
              <ProtectedRoute>
                <Layout>
                  <WastePage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/users" element={
              <ProtectedRoute>
                <Layout>
                  <UsersPage />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;