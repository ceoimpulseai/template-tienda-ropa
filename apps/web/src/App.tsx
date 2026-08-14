import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { businessConfig } from './config/business.config';
import { LoginPage } from './modules/auth/LoginPage';
import { RegisterPage } from './modules/auth/RegisterPage';
import { ForgotPasswordPage } from './modules/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './modules/auth/ResetPasswordPage';
import { TeamSettings } from './modules/team/TeamSettings';
import { BusinessSettings } from './modules/business/BusinessSettings';
import { BranchesSettings } from './modules/branches/BranchesSettings';
import { CustomersPage } from './modules/customers/CustomersPage';
import { PurchasesPage } from './modules/_example/purchases/PurchasesPage';
import { SalesPage } from './modules/_example/sales/SalesPage';
import { CostsPage } from './modules/_example/costs/CostsPage';
import { MetricsPage } from './modules/_example/metrics/MetricsPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                {businessConfig.enabledModules.metrics && <Route path="/" element={<MetricsPage />} />}
                {businessConfig.enabledModules.purchases && (
                  <Route path="/purchases" element={<PurchasesPage />} />
                )}
                {businessConfig.enabledModules.sales && <Route path="/sales" element={<SalesPage />} />}
                {businessConfig.enabledModules.costs && <Route path="/costs" element={<CostsPage />} />}
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/team" element={<TeamSettings />} />
                <Route path="/business" element={<BusinessSettings />} />
                <Route path="/branches" element={<BranchesSettings />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
