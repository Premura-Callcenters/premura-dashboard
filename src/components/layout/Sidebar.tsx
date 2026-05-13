import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Trophy,
  CalendarDays,
  Settings,
  ChevronLeft,
  ChevronDown,
  Ticket,
  UserCog,
  Phone,
  ListTodo,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const callCenterNavItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/clients', label: 'Client View', icon: Building2 },
  { path: '/agents', label: 'Agent View', icon: Users },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/historical', label: 'Historical', icon: CalendarDays },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const ticketNavItems = [
  { path: '/tickets', label: 'Ticket Board', icon: Ticket, adminOnly: false },
  { path: '/employees', label: 'Employees', icon: UserCog, adminOnly: true },
];

const DASHBOARDS = [
  { id: 'callcenter', label: 'Call Center', icon: Phone },
  { id: 'tickets', label: 'Ticket System', icon: ListTodo },
] as const;

type DashboardId = typeof DASHBOARDS[number]['id'];

const TICKET_PATHS = ['/tickets', '/employees'];

function isTicketPath(pathname: string) {
  return TICKET_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const switcherRef = useRef<HTMLDivElement>(null);

  const activeDashboard: DashboardId = isTicketPath(location.pathname) ? 'tickets' : 'callcenter';
  const activeDash = DASHBOARDS.find((d) => d.id === activeDashboard)!;

  const navItems = activeDashboard === 'callcenter'
    ? callCenterNavItems
    : ticketNavItems.filter((item) => !item.adminOnly || isSuperAdmin);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function switchDashboard(id: DashboardId) {
    setSwitcherOpen(false);
    navigate(id === 'callcenter' ? '/' : '/tickets');
  }

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[220px]'
      }`}
      style={{
        backgroundColor: '#16213e',
        borderRight: '1px solid rgba(0,212,255,0.1)',
      }}
    >
      {/* Logo row */}
      <div className="h-16 flex items-center justify-between px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {!collapsed && (
          <span
            className="text-xl font-bold tracking-wide"
            style={{
              background: 'linear-gradient(135deg, #7b2ff7, #00d4ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Premura
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-white/5 text-secondary transition-colors"
        >
          <ChevronLeft
            size={18}
            className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Dashboard switcher */}
      <div className="px-2 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} ref={switcherRef}>
        {collapsed ? (
          <button
            onClick={() => setSwitcherOpen(!switcherOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-white/5 transition-colors"
            title={activeDash.label}
          >
            <activeDash.icon size={18} style={{ color: '#00d4ff' }} />
          </button>
        ) : (
          <button
            onClick={() => setSwitcherOpen(!switcherOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-2">
              <activeDash.icon size={15} style={{ color: '#00d4ff' }} />
              <span className="text-xs font-medium text-primary">{activeDash.label}</span>
            </div>
            <ChevronDown size={12} className="text-secondary" style={{ transform: switcherOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        )}

        {switcherOpen && (
          <div
            className={`absolute mt-1 rounded-xl overflow-hidden shadow-2xl z-50 ${collapsed ? 'left-[76px] top-20' : 'left-2 right-2'}`}
            style={{ background: '#0f1627', border: '1px solid rgba(0,212,255,0.2)' }}
          >
            {DASHBOARDS.map((dash) => {
              const Icon = dash.icon;
              const active = activeDashboard === dash.id;
              return (
                <button
                  key={dash.id}
                  onClick={() => switchDashboard(dash.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors hover:bg-white/5"
                  style={{ color: active ? '#00d4ff' : 'rgba(255,255,255,0.7)' }}
                >
                  <Icon size={15} style={{ color: active ? '#00d4ff' : 'rgba(255,255,255,0.4)' }} />
                  {dash.label}
                  {active && (
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff' }}>
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 flex flex-col gap-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                active ? 'text-white' : 'text-secondary hover:text-primary hover:bg-white/5'
              }`}
              style={
                active
                  ? {
                      background: 'linear-gradient(135deg, rgba(123,47,247,0.25), rgba(0,212,255,0.15))',
                      boxShadow: '0 0 12px rgba(0,212,255,0.15)',
                    }
                  : undefined
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} style={active ? { color: '#00d4ff' } : undefined} />
              {!collapsed && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
