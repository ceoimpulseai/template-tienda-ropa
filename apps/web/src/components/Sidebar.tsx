import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { businessConfig } from '../config/business.config';
import { authClient } from '../lib/auth-client';
import { useAuth } from '../context/AuthContext';

export function Sidebar() {
  const { data: session } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const user = session?.user;
  const displayName = user?.name || user?.email || 'Usuario';

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-6 py-4">
        <span className="font-semibold text-text">{businessConfig.appName}</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {businessConfig.nav
          .filter((link) => !link.moduleKey || businessConfig.enabledModules[link.moduleKey])
          .map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm ${
                  isActive ? 'bg-bg-subtle font-medium text-primary' : 'text-text-muted hover:bg-bg-subtle hover:text-text'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
      </nav>

      <div ref={ref} className="relative border-t border-border">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex w-full items-center gap-2 px-4 py-3 text-sm text-text-muted hover:bg-bg-subtle hover:text-text"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <span className="truncate">{displayName}</span>
        </button>

        {dropdownOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-border bg-surface p-1 shadow-lg">
            <button
              onClick={() => authClient.signOut()}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-text-muted hover:bg-bg-subtle hover:text-danger"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
