import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './modules/auth/LoginPage';
import { RegisterPage } from './modules/auth/RegisterPage';
import { TeamSettings } from './modules/team/TeamSettings';
import { BusinessSettings } from './modules/business/BusinessSettings';
import { BranchesSettings } from './modules/branches/BranchesSettings';
import { PurchasesPage } from './modules/purchases/PurchasesPage';
import { SalesPage } from './modules/sales/SalesPage';
import { CostsPage } from './modules/costs/CostsPage';
import { MetricsPage } from './modules/metrics/MetricsPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<MetricsPage />} />
                <Route path="/purchases" element={<PurchasesPage />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/costs" element={<CostsPage />} />
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
