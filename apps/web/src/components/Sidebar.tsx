import { NavLink } from 'react-router-dom';
import { businessConfig } from '../config/business.config';

export function Sidebar() {
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
    </aside>
  );
}
