import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute, { AdminRoute } from './components/PrivateRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import { Accounts } from './pages/Accounts';
import Transactions from './pages/Transactions';
import { Categories } from './pages/Categories';
import { Customers } from './pages/Customers';
import { Receivables } from './pages/Receivables';
import Payables from './pages/Payables';
import Creditors from './pages/Creditors';
import Financings from './pages/Financings';
import { Investments } from './pages/Investments';
import InvestmentGoals from './pages/InvestmentGoals';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';
import Suppliers from './pages/Suppliers';
import ReceivablePayments from './pages/ReceivablePayments';
import PayablePayments from './pages/PayablePayments';
import Permissions from './pages/Permissions';
import FixedAccounts from './pages/FixedAccounts';
import AdminNotifications from './pages/admin/Notifications';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminJobs from './pages/admin/Jobs';
import AdminAudit from './pages/admin/Audit';
import { AdminDataIntegrity } from './pages/admin/DataIntegrity';
import { ResetPassword } from './pages/ResetPassword';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/accounts"
            element={
              <PrivateRoute>
                <Accounts />
              </PrivateRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <PrivateRoute>
                <Transactions />
              </PrivateRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <PrivateRoute>
                <Categories />
              </PrivateRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <PrivateRoute>
                <Customers />
              </PrivateRoute>
            }
          />
          <Route
            path="/receivables"
            element={
              <PrivateRoute>
                <Receivables />
              </PrivateRoute>
            }
          />
          <Route
            path="/fixed-accounts"
            element={
              <PrivateRoute>
                <FixedAccounts />
              </PrivateRoute>
            }
          />
          <Route
            path="/payables"
            element={
              <PrivateRoute>
                <Payables />
              </PrivateRoute>
            }
          />
          <Route
            path="/creditors"
            element={
              <PrivateRoute>
                <Creditors />
              </PrivateRoute>
            }
          />
          <Route
            path="/financings"
            element={
              <PrivateRoute>
                <Financings />
              </PrivateRoute>
            }
          />
          <Route
            path="/investments"
            element={
              <PrivateRoute>
                <Investments />
              </PrivateRoute>
            }
          />
          <Route
            path="/investment-goals"
            element={
              <PrivateRoute>
                <InvestmentGoals />
              </PrivateRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <PrivateRoute>
                <Suppliers />
              </PrivateRoute>
            }
          />
          <Route
            path="/receivable-payments"
            element={
              <PrivateRoute>
                <ReceivablePayments />
              </PrivateRoute>
            }
          />
          <Route
            path="/payable-payments"
            element={
              <PrivateRoute>
                <PayablePayments />
              </PrivateRoute>
            }
          />
          <Route
            path="/permissions"
            element={
              <PrivateRoute>
                <Permissions />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <Notifications />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <AdminRoute>
                <AdminAudit />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/jobs"
            element={
              <AdminRoute>
                <AdminJobs />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <AdminRoute>
                <AdminNotifications />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/dataintegrity"
            element={
              <AdminRoute>
                <AdminDataIntegrity />
              </AdminRoute>
            }
          />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
