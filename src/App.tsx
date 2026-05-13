import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import Overview from './components/views/Overview';
import ClientView from './components/views/ClientView';
import AgentView from './components/views/AgentView';
import LeaderboardView from './components/views/Leaderboard';
import HistoricalAnalysis from './components/views/HistoricalAnalysis';
import SettingsView from './components/views/SettingsView';
import LoginPage from './components/views/LoginPage';
import RegisterPage from './components/views/RegisterPage';
import EmployeesView from './components/views/EmployeesView';
import TicketDashboard from './components/views/tickets/TicketDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { format, subDays } from 'date-fns';

const viewLabels: Record<string, string> = {
  '/': 'Overview',
  '/clients': 'Client Campaign View',
  '/agents': 'Agent Performance View',
  '/leaderboard': 'Leaderboard',
  '/historical': 'Historical Analysis',
  '/settings': 'Settings',
  '/tickets': 'Ticket Dashboard',
  '/employees': 'Employee Management',
};

function AppShell() {
  const location = useLocation();
  const { session, employee, loading, isSuperAdmin } = useAuth();
  const viewLabel = viewLabels[location.pathname] || 'Dashboard';

  const [isLive, setIsLive] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [clientList, setClientList] = useState<{ id: string; name: string }[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    async function fetchClients() {
      const { data } = await supabase.from('companies').select('company_id, company_name');
      if (data) {
        setClientList(data.map((d: any) => ({ id: d.company_id, name: d.company_name })));
      }
    }
    if (session) fetchClients();
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel('connection-status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {})
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });
    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Show nothing while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a1a2e' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#00d4ff', borderTopColor: 'transparent' }} />
          <span className="text-sm text-secondary">Loading…</span>
        </div>
      </div>
    );
  }

  // Not logged in: only allow /login and /register
  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Logged in but no employee profile found
  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a1a2e' }}>
        <div
          className="w-full max-w-md p-8 rounded-2xl text-center"
          style={{ background: '#16213e', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <span
            className="text-2xl font-bold block mb-4"
            style={{ background: 'linear-gradient(135deg, #7b2ff7, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Premura
          </span>
          <p className="text-primary font-medium mb-2">Account not linked</p>
          <p className="text-sm text-secondary mb-6">
            Your email is not registered in the system. Please contact your administrator to be added as an employee.
          </p>
          <button
            onClick={() => { supabase.auth.signOut(); }}
            className="px-4 py-2 rounded-lg text-sm text-white"
            style={{ background: 'rgba(239,68,68,0.8)' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#1a1a2e' }}>
      <Sidebar />

      <div className="flex-1 ml-[220px] flex flex-col min-h-screen">
        <TopBar
          viewLabel={viewLabel}
          isLive={isLive}
          onRefresh={handleRefresh}
          dateRange={dateRange}
          onDateRangeChange={(start, end) => setDateRange({ start, end })}
          clients={clientList}
          selectedClients={selectedClients}
          onClientFilterChange={setSelectedClients}
        />

        <main className="flex-1 p-6" key={refreshKey}>
          <Routes>
            {/* Call Center */}
            <Route path="/" element={<Overview selectedClients={selectedClients} dateStart={dateRange.start} dateEnd={dateRange.end} />} />
            <Route path="/clients" element={<ClientView selectedClients={selectedClients} dateStart={dateRange.start} dateEnd={dateRange.end} />} />
            <Route path="/agents" element={<AgentView selectedClients={selectedClients} dateStart={dateRange.start} dateEnd={dateRange.end} />} />
            <Route path="/leaderboard" element={<LeaderboardView selectedClients={selectedClients} dateStart={dateRange.start} dateEnd={dateRange.end} />} />
            <Route path="/historical" element={<HistoricalAnalysis selectedClients={selectedClients} dateStart={dateRange.start} dateEnd={dateRange.end} />} />
            <Route path="/settings" element={<SettingsView />} />
            {/* Ticket System */}
            <Route path="/tickets" element={<TicketDashboard />} />
            <Route path="/employees" element={isSuperAdmin ? <EmployeesView /> : <Navigate to="/tickets" replace />} />
            {/* Auth pages redirect to home if already logged in */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/register" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
