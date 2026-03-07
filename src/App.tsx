import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CategoryList from './pages/CategoryList';
import ShareAccess from './pages/ShareAccess';

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="assets" element={
                <CategoryList 
                  type="asset" 
                  title="Assets" 
                  description="Manage your bank accounts, real estate, and investments." 
                />
              } />
              <Route path="debts" element={
                <CategoryList 
                  type="debt" 
                  title="Debts" 
                  description="Track mortgages, loans, and credit cards." 
                />
              } />
              <Route path="insurance" element={
                <CategoryList 
                  type="insurance" 
                  title="Life Insurance" 
                  description="Keep track of policies and beneficiary information." 
                />
              } />
              <Route path="share" element={<ShareAccess />} />
            </Route>
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}
