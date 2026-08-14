import { NavLink, Outlet } from 'react-router-dom';
import { businessConfig } from '../config/business.config';
import { ThemeToggle } from '../theme/ThemeToggle';
import { BranchSwitcher } from '../modules/branches/BranchSwitcher';
import { authClient } from '../lib/auth-client';

const links = [
  { to: '/', label: 'Métricas', enabled: businessConfig.enabledModules.metrics },
  { to: '/purchases', label: 'Compras', enabled: businessConfig.enabledModules.purchases },
  { to: '/sales', label: 'Ventas', enabled: businessConfig.enabledModules.sales },
  { to: '/costs', label: 'Gastos', enabled: businessConfig.enabledModules.costs },
  { to: '/team', label: 'Equipo', enabled: true },
  { to: '/business', label: 'Negocio', enabled: true },
  { to: '/branches', label: businessConfig.terminology.branchPlural, enabled: true },
];

export function Layout() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <span className="font-semibold text-text">{businessConfig.appName}</span>
        <nav className="flex gap-4">
          {links
            .filter((link) => link.enabled)
            .map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) => `text-sm ${isActive ? 'font-medium text-primary' : 'text-text-muted'}`}
              >
                {link.label}
              </NavLink>
            ))}
        </nav>
        <div className="flex items-center gap-3">
          <BranchSwitcher />
          <ThemeToggle />
          <button onClick={() => authClient.signOut()} className="text-sm text-text-muted hover:text-text">
            Salir
          </button>
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
