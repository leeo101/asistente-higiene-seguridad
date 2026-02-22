import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Sidebar from './components/Sidebar';
import Home from './pages/Home.jsx';
import CreateInspection from './pages/CreateInspection.jsx';
import Checklist from './pages/Checklist.jsx';
import Observation from './pages/Observation.jsx';
import Photos from './pages/Photos.jsx';
import RiskAssessment from './pages/RiskAssessment.jsx';
import History from './pages/History.jsx';
import Report from './pages/Report.jsx';
import Profile from './pages/Profile.jsx';
import Login from './pages/Login.jsx';
import PersonalData from './pages/PersonalData.jsx';
import SignatureStamp from './pages/SignatureStamp.jsx';
import AppSettings from './pages/AppSettings.jsx';
import Security from './pages/Security.jsx';
import ATS from './pages/ATS.jsx';
import ATSHistory from './pages/ATSHistory.jsx';
import FireLoad from './pages/FireLoad.jsx';
import FireLoadHistory from './pages/FireLoadHistory.jsx';
import RiskMatrix from './pages/RiskMatrix.jsx';
import RiskMatrixReport from './pages/RiskMatrixReport.jsx';
import Reports from './pages/Reports.jsx';
import ReportsReport from './pages/ReportsReport.jsx';
import AICamera from './pages/AICamera.jsx';
import AIReport from './pages/AIReport.jsx';
import Legislation from './pages/Legislation.jsx';
import Ergonomics from './pages/Ergonomics.jsx';
import ErgonomicsForm from './pages/ErgonomicsForm.jsx';
import ErgonomicsReport from './pages/ErgonomicsReport.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

import ChecklistManager from './pages/ChecklistManager.jsx';
import Subscription from './pages/Subscription.jsx';

function SubscriptionGuard({ children }) {
  const status = typeof window !== 'undefined' ? localStorage.getItem('subscriptionStatus') : null;
  const location = useLocation();

  const isPremiumRoute = [
    '/ai-camera',
    '/ai-report',
    '/checklist',
    '/checklists',
    '/ergonomics',
    '/ergonomics-form',
    '/ergonomics-report',
    '/risk-matrix',
    '/risk-matrix-report'
  ].includes(location.pathname);

  if (typeof window !== 'undefined' && status !== 'active' && isPremiumRoute) {
    return <Subscription />;
  }
  return children;
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const showMenuButton = location.pathname !== '/login';

  // Apply theme on mount
  useState(() => {
    if (typeof document !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light') {
        document.documentElement.classList.add('light-mode');
      }
    }
  });

  return (
    <div className="app-container">
      {showMenuButton && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          zIndex: 10
        }}>
          <button
            onClick={() => setIsSidebarOpen(true)}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '0.6rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            <Menu size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)', display: 'none', '@media (min-width: 640px)': { display: 'block' } }}>Asistente H&S</h1>
          </div>
        </div>
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/subscribe" element={<Subscription />} />

        {/* Protected Routes */}
        <Route path="/" element={<SubscriptionGuard><Home /></SubscriptionGuard>} />
        <Route path="/create-inspection" element={<SubscriptionGuard><CreateInspection /></SubscriptionGuard>} />
        <Route path="/checklist" element={<SubscriptionGuard><Checklist /></SubscriptionGuard>} />
        <Route path="/observation" element={<SubscriptionGuard><Observation /></SubscriptionGuard>} />
        <Route path="/photos" element={<SubscriptionGuard><Photos /></SubscriptionGuard>} />
        <Route path="/risk" element={<SubscriptionGuard><RiskAssessment /></SubscriptionGuard>} />
        <Route path="/history" element={<SubscriptionGuard><History /></SubscriptionGuard>} />
        <Route path="/report" element={<SubscriptionGuard><Report /></SubscriptionGuard>} />
        <Route path="/profile" element={<SubscriptionGuard><Profile /></SubscriptionGuard>} />
        <Route path="/personal-data" element={<SubscriptionGuard><PersonalData /></SubscriptionGuard>} />
        <Route path="/signature-stamp" element={<SubscriptionGuard><SignatureStamp /></SubscriptionGuard>} />
        <Route path="/settings" element={<SubscriptionGuard><AppSettings /></SubscriptionGuard>} />
        <Route path="/security" element={<SubscriptionGuard><Security /></SubscriptionGuard>} />
        <Route path="/ats" element={<SubscriptionGuard><ATS /></SubscriptionGuard>} />
        <Route path="/ats-history" element={<SubscriptionGuard><ATSHistory /></SubscriptionGuard>} />
        <Route path="/fire-load" element={<SubscriptionGuard><FireLoad /></SubscriptionGuard>} />
        <Route path="/fire-load-history" element={<SubscriptionGuard><FireLoadHistory /></SubscriptionGuard>} />
        <Route path="/risk-matrix" element={<SubscriptionGuard><RiskMatrix /></SubscriptionGuard>} />
        <Route path="/risk-matrix-report" element={<SubscriptionGuard><RiskMatrixReport /></SubscriptionGuard>} />
        <Route path="/reports" element={<SubscriptionGuard><Reports /></SubscriptionGuard>} />
        <Route path="/reports-report" element={<SubscriptionGuard><ReportsReport /></SubscriptionGuard>} />
        <Route path="/ai-camera" element={<SubscriptionGuard><AICamera /></SubscriptionGuard>} />
        <Route path="/ai-report" element={<SubscriptionGuard><AIReport /></SubscriptionGuard>} />
        <Route path="/legislation" element={<SubscriptionGuard><Legislation /></SubscriptionGuard>} />
        <Route path="/ergonomics" element={<SubscriptionGuard><Ergonomics /></SubscriptionGuard>} />
        <Route path="/ergonomics-form" element={<SubscriptionGuard><ErgonomicsForm /></SubscriptionGuard>} />
        <Route path="/ergonomics-report" element={<SubscriptionGuard><ErgonomicsReport /></SubscriptionGuard>} />
        <Route path="/calendar" element={<SubscriptionGuard><CalendarPage /></SubscriptionGuard>} />
        <Route path="/checklists" element={<SubscriptionGuard><ChecklistManager /></SubscriptionGuard>} />
      </Routes>
      <SpeedInsights />
    </div>
  );
}

export default App;
