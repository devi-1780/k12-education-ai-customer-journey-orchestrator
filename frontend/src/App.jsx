import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import LoginPage from './pages/Login/LoginPage.jsx';
import DashboardPage from './pages/Dashboard/DashboardPage.jsx';
import ProfilesPage from './pages/Profiles/ProfilesPage.jsx';
import JourneyPage from './pages/Journey/JourneyPage.jsx';
import EngagementPage from './pages/Engagement/EngagementPage.jsx';
import TicketsPage from './pages/Tickets/TicketsPage.jsx';
import PredictionsPage from './pages/Predictions/PredictionsPage.jsx';
import RecommendationsPage from './pages/Recommendations/RecommendationsPage.jsx';
import OutcomesPage from './pages/Outcomes/OutcomesPage.jsx';
import ReportsPage from './pages/Reports/ReportsPage.jsx';
import NotificationsPage from './pages/Notifications/NotificationsPage.jsx';
import UsersPage from './pages/Users/UsersPage.jsx';
import AuditPage from './pages/Audit/AuditPage.jsx';

function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0">
        <Navbar onToggleSidebar={() => setSidebarOpen((o) => !o)} />
        <main className="p-4 md:p-6 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  const { accessToken } = useSelector((s) => s.auth);

  return (
    <Routes>
      <Route path="/login" element={accessToken ? <Navigate to="/" replace /> : <LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AppLayout><DashboardPage /></AppLayout>} />
        <Route path="/profiles" element={<AppLayout><ProfilesPage /></AppLayout>} />
        <Route path="/journey" element={<AppLayout><JourneyPage /></AppLayout>} />
        <Route path="/tickets" element={<AppLayout><TicketsPage /></AppLayout>} />
        <Route path="/notifications" element={<AppLayout><NotificationsPage /></AppLayout>} />
      </Route>

      <Route element={<ProtectedRoute roles={['admin', 'sales_manager', 'marketing_manager']} />}>
        <Route path="/engagement" element={<AppLayout><EngagementPage /></AppLayout>} />
        <Route path="/outcomes" element={<AppLayout><OutcomesPage /></AppLayout>} />
      </Route>

      <Route element={<ProtectedRoute roles={['admin', 'sales_manager', 'marketing_manager', 'service_agent']} />}>
        <Route path="/predictions" element={<AppLayout><PredictionsPage /></AppLayout>} />
        <Route path="/recommendations" element={<AppLayout><RecommendationsPage /></AppLayout>} />
        <Route path="/reports" element={<AppLayout><ReportsPage /></AppLayout>} />
      </Route>

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/users" element={<AppLayout><UsersPage /></AppLayout>} />
        <Route path="/audit" element={<AppLayout><AuditPage /></AppLayout>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
