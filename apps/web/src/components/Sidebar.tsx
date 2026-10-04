import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { businessConfig, type NavEntry } from '../config/business.config';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { useCan } from '../hooks/useCan';
import { ROLES, ROLE_LABELS, type Role } from '@template/shared';
import {
  SidebarToggleIcon,
  BarChartIcon,
  PackageIcon,
  ShoppingCartIcon,
  ReceiptIcon,
  WalletIcon,
  CalculatorIcon,
  TruckIcon,
  UsersIcon,
  ShieldCheckIcon,
  BuildingIcon,
  MapPinIcon,
  StoreIcon,
  LogOutIcon,
  SparklesIcon,
  SunIcon,
  MoonIcon,
} from './SidebarIcons';

function getNavIcon(entry: NavEntry) {
  switch (entry.to) {
    case '/':
      return <BarChartIcon className="h-5 w-5 shrink-0" />;
    case '/catalog':
      return <PackageIcon className="h-5 w-5 shrink-0" />;
    case '/purchases':
      return <ShoppingCartIcon className="h-5 w-5 shrink-0" />;
    case '/sales':
      return <ReceiptIcon className="h-5 w-5 shrink-0" />;
    case '/costs':
      return <WalletIcon className="h-5 w-5 shrink-0" />;
    case '/financials':
      return <CalculatorIcon className="h-5 w-5 shrink-0" />;
    case '/suppliers':
      return <TruckIcon className="h-5 w-5 shrink-0" />;
    case '/customers':
      return <UsersIcon className="h-5 w-5 shrink-0" />;
    case '/team':
      return <ShieldCheckIcon className="h-5 w-5 shrink-0" />;
    case '/business':
      return <BuildingIcon className="h-5 w-5 shrink-0" />;
    case '/branches':
      return <MapPinIcon className="h-5 w-5 shrink-0" />;
    default:
      if (entry.to.includes('tienda') || entry.to.includes('catalog')) {
        return <StoreIcon className="h-5 w-5 shrink-0" />;
      }
      return <PackageIcon className="h-5 w-5 shrink-0" />;
  }
}

export function Sidebar() {
  const { data: session, signOut, isDemo, customRole, setCustomRole } = useAuth();
  const { permissions } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const can = useCan();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
    setDropdownOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const user = session?.user;
  const userEmail = user?.email || 'ceo.impulseai@gmail.com';
  const userName = user?.name || (userEmail.startsWith('ceo') ? 'Impulse AI' : (userEmail.split('@')[0] ?? 'Impulse AI'));
  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'IA';

  const activeNavLinks = businessConfig.nav.filter(
    (link) =>
      (!link.moduleKey || businessConfig.enabledModules[link.moduleKey]) &&
      (!link.permission || can(link.permission)),
  );

  return (
    <aside
      id="main-sidebar"
      className={`sticky top-0 left-0 z-30 flex h-screen max-h-screen shrink-0 flex-col bg-[#171717] text-[#ececec] border-r border-[#282828] select-none transition-[width] duration-300 ease-in-out ${
        isCollapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      {/* Header: Logo / App Name + Collapse / Expand Toggle */}
      <div className="flex h-14 shrink-0 items-center justify-between px-3 border-b border-[#262626]/80">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2.5 overflow-hidden pl-1">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-sky-600 to-teal-400 text-white shadow-sm">
                <SparklesIcon className="h-4 w-4" />
              </div>
              <span className="truncate text-sm font-semibold tracking-tight text-white">
                {businessConfig.appName || 'ChatGPT Admin'}
              </span>
            </div>

            {/* Toggle Collapse Button */}
            <button
              id="sidebar-toggle-collapse-btn"
              type="button"
              onClick={toggleCollapse}
              title="Plegar barra lateral"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              <SidebarToggleIcon className="h-4.5 w-4.5" />
              <span className="sr-only">Plegar barra lateral</span>
            </button>
          </>
        ) : (
          /* When collapsed: the toggle icon is hidden normally, and appears when hovering over the logo in the header! */
          <button
            id="sidebar-logo-toggle-expand-btn"
            type="button"
            onClick={toggleCollapse}
            title="Desplegar barra lateral"
            className="group relative mx-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl transition-colors hover:bg-neutral-800 focus:outline-none"
          >
            {/* Normal state: Logo */}
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-sky-600 to-teal-400 text-white shadow-sm transition-opacity duration-150 group-hover:opacity-0">
              <SparklesIcon className="h-4 w-4" />
            </div>

            {/* Hover state: Sidebar toggle icon appears */}
            <div className="absolute inset-0 flex items-center justify-center text-neutral-300 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-hover:text-white">
              <SidebarToggleIcon className="h-5 w-5" />
            </div>
            <span className="sr-only">Desplegar barra lateral</span>
          </button>
        )}
      </div>

      {/* Navigation List - overflow-x-hidden ensures no horizontal scrollbar ever */}
      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-2 py-2.5 scrollbar-thin scrollbar-thumb-neutral-800">
        {!isCollapsed && (
          <div className="px-3 pb-1 pt-1 text-[11px] font-medium tracking-wider uppercase text-neutral-500">
            Módulos
          </div>
        )}

        {activeNavLinks.map((link) => {
          const icon = getNavIcon(link);

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              title={link.label}
              className={({ isActive }) =>
                `flex items-center cursor-pointer transition-all ${
                  isCollapsed
                    ? `mx-auto h-10 w-10 justify-center rounded-xl ${
                        isActive
                          ? 'bg-neutral-800 text-white ring-1 ring-neutral-700 shadow-xs'
                          : 'text-neutral-400 hover:bg-neutral-850 hover:text-neutral-100'
                      }`
                    : `gap-3 px-3 py-2.5 rounded-xl text-sm ${
                        isActive
                          ? 'bg-neutral-800/95 font-medium text-white shadow-xs'
                          : 'text-neutral-300 hover:bg-neutral-850/80 hover:text-white'
                      }`
                }`
              }
            >
              {icon}
              {!isCollapsed && <span className="truncate">{link.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer: User Profile & Dropdown */}
      <div ref={dropdownRef} className="relative shrink-0 border-t border-[#262626] p-2.5">
        {/* Dropdown Menu (Opens on clicking user row) */}
        {dropdownOpen && (
          <div
            id="sidebar-user-dropdown"
            className={`absolute z-50 rounded-2xl border border-neutral-750 bg-[#212121] p-2 shadow-2xl text-neutral-200 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ${
              isCollapsed
                ? 'bottom-2 left-full ml-2 w-60'
                : 'bottom-full left-2 right-2 mb-2'
            }`}
          >
            {/* Theme Toggle Button */}
            <button
              id="sidebar-theme-toggle-btn"
              type="button"
              onClick={toggleTheme}
              className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-800/80 hover:text-white"
            >
              <div className="flex items-center gap-2">
                {theme === 'dark' ? (
                  <MoonIcon className="h-4 w-4 text-neutral-400" />
                ) : (
                  <SunIcon className="h-4 w-4 text-amber-400" />
                )}
                <span>{theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}</span>
              </div>

              {/* Toggle switch in place of the "Gratis" badge */}
              <div
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-neutral-700/80 p-0.5 transition-colors duration-200 ease-in-out ${
                  theme === 'dark' ? 'bg-sky-600' : 'bg-neutral-800'
                }`}
                aria-hidden="true"
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                    theme === 'dark' ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>

            <div className="my-1.5 border-t border-neutral-750" />

            {/* Demo Role Switcher */}
            {isDemo && (
              <>
                <div className="my-1.5 border-t border-neutral-750" />
                <div className="px-3 py-1 text-[11px] font-medium tracking-wider uppercase text-neutral-500">
                  Rol de prueba
                </div>
                <select
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value as Role)}
                  className="mx-3 mb-2 w-[calc(100%-24px)] rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </>
            )}

            <div className="my-1.5 border-t border-neutral-750" />

            {/* Logout Action */}
            <button
              id="sidebar-logout-btn"
              type="button"
              onClick={async () => {
                setDropdownOpen(false);
                await signOut();
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-red-500/15 hover:text-red-400 text-left"
            >
              <LogOutIcon className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}

        {/* User Button */}
        <button
          id="sidebar-user-trigger"
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          title={isCollapsed ? `${userName} (${userEmail})` : undefined}
          className={`flex w-full cursor-pointer items-center rounded-xl transition-all ${
            isCollapsed
              ? 'h-10 justify-center hover:bg-neutral-850'
              : 'gap-3 p-2 hover:bg-neutral-850 text-left'
          } ${dropdownOpen ? 'bg-neutral-800 ring-1 ring-neutral-700' : ''}`}
        >
          {/* Avatar Circle */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white shadow-xs ring-1 ring-sky-400/50">
            {initials}
          </div>

          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-neutral-100">{userName}</div>
                <div className="truncate text-[11px] text-neutral-400 font-normal" title={userEmail}>
                  {userEmail}
                </div>
              </div>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
