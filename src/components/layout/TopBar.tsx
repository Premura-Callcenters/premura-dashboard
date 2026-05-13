import { RefreshCw, ChevronDown, X, Check, Calendar, LogOut, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface TopBarProps {
  viewLabel: string;
  isLive: boolean;
  onRefresh: () => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (start: string, end: string) => void;
  clients: { id: string; name: string }[];
  selectedClients: string[];
  onClientFilterChange: (ids: string[]) => void;
}

const TICKET_PATHS = ['/tickets', '/employees'];

export default function TopBar({
  viewLabel,
  isLive,
  onRefresh,
  dateRange,
  onDateRangeChange,
  clients,
  selectedClients,
  onClientFilterChange,
}: TopBarProps) {
  const location = useLocation();
  const { employee, signOut } = useAuth();

  const isTicketModule = TICKET_PATHS.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'));

  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredClients = clients
    .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const toggleClient = (id: string) => {
    if (selectedClients.includes(id)) {
      onClientFilterChange(selectedClients.filter((c) => c !== id));
    } else {
      onClientFilterChange([...selectedClients, id]);
    }
  };

  const selectAll = () => onClientFilterChange([]);

  const selectedLabel = selectedClients.length === 0
    ? 'All Clients'
    : selectedClients.length === 1
      ? clients.find((c) => c.id === selectedClients[0])?.name || '1 Client'
      : `${selectedClients.length} Clients`;

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const initials = employee?.name
    ? employee.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 gap-4"
      style={{
        backdropFilter: 'blur(10px)',
        background: 'rgba(26,26,46,0.85)',
        borderBottom: '1px solid rgba(0,212,255,0.1)',
        height: '56px',
      }}
    >
      {/* Left: View label */}
      <h1 className="text-lg font-semibold text-primary whitespace-nowrap">{viewLabel}</h1>

      {/* Center: Call-center filters (hidden on ticket module) */}
      {!isTicketModule && (
        <div className="flex items-center gap-3 flex-1 justify-center">
          {/* Date range */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:border-cyan/50 transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={() => startDateRef.current?.showPicker()}
          >
            <Calendar size={14} className="text-secondary" />
            <span className="text-sm text-primary">{formatDateLabel(dateRange.start)}</span>
            <input
              ref={startDateRef}
              type="date"
              value={dateRange.start}
              max={dateRange.end}
              onChange={(e) => onDateRangeChange(e.target.value, dateRange.end)}
              className="absolute opacity-0 pointer-events-none w-0 h-0"
              tabIndex={-1}
            />
          </div>

          <span className="text-secondary text-sm">to</span>

          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:border-cyan/50 transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={() => endDateRef.current?.showPicker()}
          >
            <Calendar size={14} className="text-secondary" />
            <span className="text-sm text-primary">{formatDateLabel(dateRange.end)}</span>
            <input
              ref={endDateRef}
              type="date"
              value={dateRange.end}
              min={dateRange.start}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => onDateRangeChange(dateRange.start, e.target.value)}
              className="absolute opacity-0 pointer-events-none w-0 h-0"
              tabIndex={-1}
            />
          </div>

          {/* Client filter dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${clientDropdownOpen ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                minWidth: '180px',
              }}
            >
              <span className="text-sm text-primary flex-1 text-left">{selectedLabel}</span>
              {selectedClients.length > 0 && (
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: 'rgba(0,212,255,0.2)', color: '#00d4ff' }}>
                  {selectedClients.length}
                </span>
              )}
              <ChevronDown size={14} className="text-secondary transition-transform" style={{ transform: clientDropdownOpen ? 'rotate(180deg)' : 'none' }} />
            </button>

            {clientDropdownOpen && (
              <div
                className="absolute top-full left-0 mt-2 rounded-xl overflow-hidden shadow-2xl"
                style={{ background: '#16213e', border: '1px solid rgba(0,212,255,0.2)', width: '320px', maxHeight: '400px', zIndex: 50 }}
              >
                <div className="p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2 rounded-lg text-sm text-primary outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <button onClick={selectAll} className="text-xs hover:underline" style={{ color: '#00d4ff' }}>All Clients</button>
                  {selectedClients.length > 0 && (
                    <button onClick={selectAll} className="text-xs text-secondary hover:text-primary flex items-center gap-1">
                      <X size={10} /> Clear
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
                  {filteredClients.map((client) => {
                    const isSelected = selectedClients.includes(client.id);
                    return (
                      <button
                        key={client.id}
                        onClick={() => toggleClient(client.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                        style={{ background: isSelected ? 'rgba(0,212,255,0.08)' : 'transparent' }}
                      >
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                          style={{
                            border: `1.5px solid ${isSelected ? '#00d4ff' : 'rgba(255,255,255,0.2)'}`,
                            background: isSelected ? 'rgba(0,212,255,0.2)' : 'transparent',
                          }}
                        >
                          {isSelected && <Check size={10} style={{ color: '#00d4ff' }} />}
                        </div>
                        <span className="text-sm text-primary truncate">{client.name}</span>
                      </button>
                    );
                  })}
                  {filteredClients.length === 0 && (
                    <div className="px-3 py-4 text-sm text-secondary text-center">No clients found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right: Live indicator + refresh + user */}
      <div className="flex items-center gap-3 ml-auto">
        {!isTicketModule && (
          <>
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: isLive ? '#00d4ff' : '#ef4444',
                  boxShadow: isLive ? '0 0 8px #00d4ff' : 'none',
                  animation: isLive ? 'pulse 2s infinite' : 'none',
                }}
              />
              <span className="text-xs text-secondary">{isLive ? 'Live' : 'Offline'}</span>
            </div>
            <button onClick={onRefresh} className="p-2 rounded-lg hover:bg-white/5 text-secondary hover:text-cyan transition-colors" title="Refresh data">
              <RefreshCw size={16} />
            </button>
          </>
        )}

        {/* User avatar + menu */}
        {employee && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #7b2ff7, #00d4ff)', color: '#fff' }}
              >
                {initials}
              </div>
              {!isTicketModule && <span className="text-sm text-primary hidden sm:block">{employee.name.split(' ')[0]}</span>}
              <ChevronDown size={12} className="text-secondary" />
            </button>

            {userMenuOpen && (
              <div
                className="absolute top-full right-0 mt-2 rounded-xl overflow-hidden shadow-2xl z-50"
                style={{ background: '#16213e', border: '1px solid rgba(255,255,255,0.1)', minWidth: '200px' }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-sm font-medium text-primary">{employee.name}</p>
                  <p className="text-xs text-secondary mt-0.5">{employee.email}</p>
                  {employee.department && <p className="text-xs text-secondary">{employee.department}</p>}
                  <span
                    className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs"
                    style={
                      employee.role === 'superadmin'
                        ? { background: 'rgba(123,47,247,0.2)', color: '#a78bfa' }
                        : { background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }
                    }
                  >
                    {employee.role === 'superadmin' ? 'SupaAdmin' : 'Employee'}
                  </span>
                </div>
                <button
                  onClick={() => { setUserMenuOpen(false); signOut(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-white/5 transition-colors"
                  style={{ color: '#ef4444' }}
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}

        {/* Fallback icon if no employee profile yet */}
        {!employee && (
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <User size={14} className="text-secondary" />
          </div>
        )}
      </div>
    </header>
  );
}
