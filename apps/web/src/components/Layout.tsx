import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from '../theme/ThemeToggle';
import { BranchSwitcher } from '../modules/branches/BranchSwitcher';
import { authClient } from '../lib/auth-client';

export function Layout() {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-border px-6 py-3">
          <BranchSwitcher />
          <ThemeToggle />
          <button onClick={() => authClient.signOut()} className="text-sm text-text-muted hover:text-text">
            Salir
          </button>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
