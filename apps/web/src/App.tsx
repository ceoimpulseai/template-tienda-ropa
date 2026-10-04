import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RequirePermission } from './components/RequirePermission';
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
import { ItemsPage } from './modules/items/ItemsPage';
import { SuppliersPage } from './modules/suppliers/SuppliersPage';
import { PublicCatalogPage } from './modules/catalog/PublicCatalogPage';
import { PurchasesPage } from './modules/_example/purchases/PurchasesPage';
import { SalesPage } from './modules/_example/sales/SalesPage';
import { CostsPage } from './modules/_example/costs/CostsPage';
import { MetricsPage } from './modules/_example/metrics/MetricsPage';
import { FinancialsPage } from './modules/_example/financials/FinancialsPage';
import { EmployeesPage } from './modules/employees/EmployeesPage';

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
            {businessConfig.enabledModules.catalog && (
              <Route path="/tienda/:businessId" element={<PublicCatalogPage />} />
            )}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                {businessConfig.enabledModules.metrics && (
                  <Route element={<RequirePermission permission="metrics:read" />}>
                    <Route path="/" element={<MetricsPage />} />
                  </Route>
                )}
                {businessConfig.enabledModules.purchases && (
                  <Route element={<RequirePermission permission="purchases:read" />}>
                    <Route path="/purchases" element={<PurchasesPage />} />
                  </Route>
                )}
                {businessConfig.enabledModules.sales && (
                  <Route element={<RequirePermission permission="sales:read" />}>
                    <Route path="/sales" element={<SalesPage />} />
                  </Route>
                )}
                {businessConfig.enabledModules.costs && (
                  <Route element={<RequirePermission permission="costs:read" />}>
                    <Route path="/costs" element={<CostsPage />} />
                  </Route>
                )}
                {businessConfig.enabledModules.financials && (
                  <Route element={<RequirePermission permission="financials:read" />}>
                    <Route path="/financials" element={<FinancialsPage />} />
                  </Route>
                )}
                <Route element={<RequirePermission permission="customers:read" />}>
                  <Route path="/customers" element={<CustomersPage />} />
                </Route>
                <Route element={<RequirePermission permission="items:read" />}>
                  <Route path="/catalog" element={<ItemsPage />} />
                </Route>
                <Route element={<RequirePermission permission="suppliers:read" />}>
                  <Route path="/suppliers" element={<SuppliersPage />} />
                </Route>
                <Route element={<RequirePermission permission="employees:read" />}>
                  <Route path="/employees" element={<EmployeesPage />} />
                </Route>
                <Route element={<RequirePermission permission="team:read" />}>
                  <Route path="/team" element={<TeamSettings />} />
                </Route>
                <Route element={<RequirePermission permission="business:read" />}>
                  <Route path="/business" element={<BusinessSettings />} />
                </Route>
                <Route element={<RequirePermission permission="branches:read" />}>
                  <Route path="/branches" element={<BranchesSettings />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
