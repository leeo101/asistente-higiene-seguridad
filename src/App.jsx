import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
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
import Security from './pages/Security.jsx';
import AppSettings from './pages/AppSettings.jsx';
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
import SafetyCalendar from './pages/SafetyCalendar.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import AdminRequests from './pages/AdminRequests.jsx';


import ChecklistsHistory from './pages/ChecklistsHistory.jsx';
import ChecklistManager from './pages/ChecklistManager.jsx';
import Subscription from './pages/Subscription.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

function SubscriptionGuard({ children }) {
  const status = typeof window !== 'undefined' ? localStorage.getItem('subscriptionStatus') : null;
  const location = useLocation();

  if (status !== 'active' && location.pathname !== '/subscribe' && location.pathname !== '/login') {
    return <Subscription />;
  }
  return children;
}

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const showMenuButton = location.pathname !== '/login' && location.pathname !== '/subscribe' && location.pathname !== '/ai-camera';

  // Apply theme on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  return (
    <AuthProvider>
      <div className="app-container">
        {showMenuButton && (
          <div
            className="glass-panel"
            style={{
              position: 'fixed',
              top: '1rem',
              left: '1rem',
              right: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              zIndex: 10,
              padding: '0.8rem 1rem',
              background: 'rgba(24, 24, 27, 0.4)'
            }}>
            <button
              onClick={() => setIsSidebarOpen(true)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)'
              }}
            >
              <Menu size={22} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '36px', height: '36px', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))' }} />
              <h1 className="header-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Asistente H&S</h1>
            </div>
          </div>
        )}

        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/subscribe" element={<Subscription />} />

          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/ats" element={<ATS />} />
          <Route path="/fire-load" element={<FireLoad />} />
          <Route path="/legislation" element={<Legislation />} />
          <Route path="/checklists" element={<ChecklistManager />} />
          <Route path="/create-inspection" element={<CreateInspection />} />
          <Route path="/checklist" element={<Checklist />} />
          <Route path="/observation" element={<Observation />} />
          <Route path="/photos" element={<Photos />} />
          <Route path="/ai-camera" element={<AICamera />} />
          <Route path="/ai-report" element={<AIReport />} />
          <Route path="/calendar" element={<SafetyCalendar />} />

          {/* Tools that are now accessible but will have paywall on print */}
          <Route path="/risk" element={<RiskAssessment />} />
          <Route path="/report" element={<Report />} />
          <Route path="/risk-matrix" element={<RiskMatrix />} />
          <Route path="/risk-matrix-report" element={<RiskMatrixReport />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports-report" element={<ReportsReport />} />
          <Route path="/ergonomics" element={<Ergonomics />} />
          <Route path="/ergonomics-form" element={<ErgonomicsForm />} />
          <Route path="/ergonomics-report" element={<ErgonomicsReport />} />

          {/* Protected Private Routes */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/personal-data" element={<ProtectedRoute><PersonalData /></ProtectedRoute>} />
          <Route path="/signature-stamp" element={<ProtectedRoute><SignatureStamp /></ProtectedRoute>} />
          <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AppSettings /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/ats-history" element={<ProtectedRoute><ATSHistory /></ProtectedRoute>} />
          <Route path="/fire-load-history" element={<ProtectedRoute><FireLoadHistory /></ProtectedRoute>} />
          <Route path="/checklists-history" element={<ProtectedRoute><ChecklistsHistory /></ProtectedRoute>} />
          <Route path="/admin/requests" element={<ProtectedRoute><AdminRequests /></ProtectedRoute>} />

          <Route path="/matrices" element={<Navigate to="/risk-matrix" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
