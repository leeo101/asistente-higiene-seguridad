import { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import { Menu, Search, Cloud, CloudOff } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen.jsx';
import NetworkBadge from './components/NetworkBadge.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';

// Custom lazy loader that catches chunk errors and reloads
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        // Assume that the error is a chunk load error due to a new deployment
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        return window.location.reload();
      }
      // If we already refreshed and it still failed, throw to an error boundary
      throw error;
    }
  });

// LAZY LOADED PAGES
const CreateInspection = lazyWithRetry(() => import('./pages/CreateInspection.jsx'));
const Checklist = lazyWithRetry(() => import('./pages/Checklist.jsx'));
const Observation = lazyWithRetry(() => import('./pages/Observation.jsx'));
const Photos = lazyWithRetry(() => import('./pages/Photos.jsx'));
const RiskAssessment = lazyWithRetry(() => import('./pages/RiskAssessment.jsx'));
const History = lazyWithRetry(() => import('./pages/History.jsx'));
const Report = lazyWithRetry(() => import('./pages/Report.jsx'));
const Profile = lazyWithRetry(() => import('./pages/Profile.jsx'));
const PersonalData = lazyWithRetry(() => import('./pages/PersonalData.jsx'));
const SignatureStamp = lazyWithRetry(() => import('./pages/SignatureStamp.jsx'));
const Security = lazyWithRetry(() => import('./pages/Security.jsx'));
const AppSettings = lazyWithRetry(() => import('./pages/AppSettings.jsx'));
const ATS = lazyWithRetry(() => import('./pages/ATS.jsx'));
const ATSHistory = lazyWithRetry(() => import('./pages/ATSHistory.jsx'));
const FireLoad = lazyWithRetry(() => import('./pages/FireLoad.jsx'));
const FireLoadHistory = lazyWithRetry(() => import('./pages/FireLoadHistory.jsx'));
const RiskMatrix = lazyWithRetry(() => import('./pages/RiskMatrix.jsx'));
const RiskMatrixReport = lazyWithRetry(() => import('./pages/RiskMatrixReport.jsx'));
const Reports = lazyWithRetry(() => import('./pages/Reports.jsx'));
const ReportsReport = lazyWithRetry(() => import('./pages/ReportsReport.jsx'));
const AICamera = lazyWithRetry(() => import('./pages/AICamera.jsx'));
const AIGeneralCamera = lazyWithRetry(() => import('./pages/AIGeneralCamera.jsx'));
const AIChatAdvisor = lazyWithRetry(() => import('./pages/AIChatAdvisor.jsx'));
const AIReport = lazyWithRetry(() => import('./pages/AIReport.jsx'));
const Legislation = lazyWithRetry(() => import('./pages/Legislation.jsx'));
const Ergonomics = lazyWithRetry(() => import('./pages/Ergonomics.jsx'));
const ErgonomicsForm = lazyWithRetry(() => import('./pages/ErgonomicsForm.jsx'));
const ErgonomicsReport = lazyWithRetry(() => import('./pages/ErgonomicsReport.jsx'));
const SafetyCalendar = lazyWithRetry(() => import('./pages/SafetyCalendar.jsx'));
const ResetPassword = lazyWithRetry(() => import('./pages/ResetPassword.jsx'));
const AdminRequests = lazyWithRetry(() => import('./pages/AdminRequests.jsx'));
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy.jsx'));
const LightingReport = lazyWithRetry(() => import('./pages/LightingReport.jsx'));
const LightingHistory = lazyWithRetry(() => import('./pages/LightingHistory.jsx'));
const WorkPermit = lazyWithRetry(() => import('./pages/WorkPermit.jsx'));
const WorkPermitHistory = lazyWithRetry(() => import('./pages/WorkPermitHistory.jsx'));
const RiskAssessmentHistory = lazyWithRetry(() => import('./pages/RiskAssessmentHistory.jsx'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound.jsx'));
const PPETracker = lazyWithRetry(() => import('./pages/PPETracker.jsx'));
const Analytics = lazyWithRetry(() => import('./pages/Analytics.jsx'));
const ChecklistsHistory = lazyWithRetry(() => import('./pages/ChecklistsHistory.jsx'));
const ChecklistManager = lazyWithRetry(() => import('./pages/ChecklistManager.jsx'));
const Subscription = lazyWithRetry(() => import('./pages/Subscription.jsx'));
const AIHistory = lazyWithRetry(() => import('./pages/AIHistory.jsx'));
const AICameraHistory = lazyWithRetry(() => import('./pages/AICameraHistory.jsx'));
const ManagementReport = lazyWithRetry(() => import('./pages/ManagementReport.jsx'));
const AccidentInvestigation = lazyWithRetry(() => import('./pages/AccidentInvestigation.jsx'));
const AccidentHistory = lazyWithRetry(() => import('./pages/AccidentHistory.jsx'));
const TrainingManagement = lazyWithRetry(() => import('./pages/TrainingManagement.jsx'));
const TrainingHistory = lazyWithRetry(() => import('./pages/TrainingHistory.jsx'));
const Extinguishers = lazyWithRetry(() => import('./pages/Extinguishers.jsx'));
const ExtinguisherPdfGenerator = lazyWithRetry(() => import('./components/ExtinguisherPdfGenerator.jsx'));
const ThermalStress = lazyWithRetry(() => import('./pages/ThermalStress.jsx'));
const ThermalStressHistory = lazyWithRetry(() => import('./pages/ThermalStressHistory.jsx'));
const Drills = lazyWithRetry(() => import('./pages/Drills.jsx'));
const DrillsHistory = lazyWithRetry(() => import('./pages/DrillsHistory.jsx'));
const RiskMapGenerator = lazyWithRetry(() => import('./pages/RiskMapGenerator.jsx'));
const RiskMapHistory = lazyWithRetry(() => import('./pages/RiskMapHistory.jsx'));

import InstallBanner from './components/InstallBanner.jsx';
import GlobalSearch from './components/GlobalSearch.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { SyncProvider, useSync } from './contexts/SyncContext.jsx';
import { Toaster, toast } from 'react-hot-toast';
import { usePaywall } from './hooks/usePaywall.js';

function SubscriptionGuard({ children }) {
  const status = typeof window !== 'undefined' ? localStorage.getItem('subscriptionStatus') : null;
  const location = useLocation();

  if (status !== 'active' && location.pathname !== '/subscribe' && location.pathname !== '/login') {
    return <Subscription />;
  }
  return children;
}

function GlobalPrintGuard() {
  const { isPro } = usePaywall();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Ctrl+P (Windows/Linux) or Cmd+P (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        if (!isPro()) {
          e.preventDefault();
          e.stopPropagation();
          toast.error('La función de impresión es exclusiva para usuarios PRO y Administradores.', {
            id: 'print-blocked-toast',
            duration: 4000,
            icon: '⚠️',
            style: {
              borderRadius: '12px',
              background: '#1e293b',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)'
            }
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isPro]);

  return null;
}

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function CloudStatusIndicator() {
  const { currentUser } = useAuth();
  const { syncing, lastSync } = useSync();
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!currentUser) return null;

  if (!isOnline) {
    return (
      <div
        title="Sin conexión (los cambios se guardan localmente)"
        style={{
          display: 'flex', alignItems: 'center', gap: '0.25rem',
          fontSize: '0.65rem', fontWeight: 700,
          color: '#fbbf24', // Amber/yellow for warning
          flexShrink: 0, whiteSpace: 'nowrap'
        }}
      >
        <CloudOff size={16} />
        <span style={{ display: 'none' }} className="header-title">Offline</span>
      </div>
    );
  }

  return (
    <div
      title={syncing ? 'Sincronizando...' : lastSync ? `Sincronizado ${lastSync.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}` : 'Conectado a la nube'}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.25rem',
        fontSize: '0.65rem', fontWeight: 700,
        color: syncing ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.9)',
        flexShrink: 0, whiteSpace: 'nowrap'
      }}
    >
      {syncing ? (
        <Cloud size={16} style={{ animation: 'pulse 1.5s infinite', color: '#93c5fd' }} />
      ) : (
        <Cloud size={16} style={{ color: '#86efac' }} />
      )}
      <span style={{ display: 'none' }} className="header-title">{syncing ? 'Sync...' : '✓'}</span>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname]);

  return null;
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const showMenuButton = location.pathname !== '/login' && location.pathname !== '/subscribe' && location.pathname !== '/ai-camera';

  // Apply theme on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  // Ctrl+K shortcut for global search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(s => !s);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <AuthProvider>
      <SyncProvider>
        <GlobalPrintGuard />
        <NetworkBadge />
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              background: '#fff',
              color: '#1e293b',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              padding: '12px 20px',
            },
            success: {
              style: {
                background: '#10b981',
                color: '#fff',
              },
            },
            error: {
              style: {
                background: '#ef4444',
                color: '#fff',
              },
            },
          }}
        />
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
                background: 'var(--color-header-bg)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '14px',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}>
              <button
                onClick={() => setIsSidebarOpen(true)}
                style={{
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <Menu size={22} />
              </button>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', color: 'var(--color-text)', flex: 1 }}>
                <img src="/logo.png" alt="Logo" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
                <h1 className="header-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.3px' }}>Asistente HYS</h1>
              </Link>
              {/* Global Search button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                title="Buscar (Ctrl+K)"
                style={{
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-muted)',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <Search size={20} />
              </button>
              {/* Cloud sync status */}
              <CloudStatusIndicator />
            </div>
          )}

          {/* Global Search Modal */}
          {isSearchOpen && <GlobalSearch onClose={() => setIsSearchOpen(false)} />}

          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          <Suspense fallback={<LoadingScreen />}>
            <div key={location.pathname} className="page-transition" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Routes location={location}>
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/subscribe" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                <Route path="/privacy" element={<PrivacyPolicy />} />

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
                <Route path="/ai-general-camera" element={<AIGeneralCamera />} />
                <Route path="/ai-advisor" element={<AIChatAdvisor />} />
                <Route path="/ai-history" element={<AIHistory />} />
                <Route path="/ai-report" element={<AIReport />} />
                <Route path="/calendar" element={<SafetyCalendar />} />
                <Route path="/ai-camera-history" element={<AICameraHistory />} />
                <Route path="/lighting" element={<LightingReport />} />

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
                <Route path="/lighting-history" element={<ProtectedRoute><LightingHistory /></ProtectedRoute>} />
                <Route path="/work-permit" element={<ProtectedRoute><WorkPermit /></ProtectedRoute>} />
                <Route path="/work-permit-history" element={<ProtectedRoute><WorkPermitHistory /></ProtectedRoute>} />
                <Route path="/risk-assessment-history" element={<ProtectedRoute><RiskAssessmentHistory /></ProtectedRoute>} />
                <Route path="/admin/requests" element={<ProtectedRoute><AdminRequests /></ProtectedRoute>} />
                <Route path="/PPE-tracker" element={<ProtectedRoute><PPETracker /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/management-report" element={<ProtectedRoute><ManagementReport /></ProtectedRoute>} />
                <Route path="/accident-investigation" element={<ProtectedRoute><AccidentInvestigation /></ProtectedRoute>} />
                <Route path="/accident-history" element={<ProtectedRoute><AccidentHistory /></ProtectedRoute>} />
                <Route path="/training-management" element={<ProtectedRoute><TrainingManagement /></ProtectedRoute>} />
                <Route path="/training-history" element={<ProtectedRoute><TrainingHistory /></ProtectedRoute>} />
                <Route path="/extinguishers" element={<ProtectedRoute><Extinguishers /></ProtectedRoute>} />
                <Route path="/extinguishers-report" element={<ProtectedRoute><ExtinguisherPdfGenerator /></ProtectedRoute>} />
                <Route path="/thermal-stress" element={<ProtectedRoute><ThermalStress /></ProtectedRoute>} />
                <Route path="/thermal-stress-history" element={<ProtectedRoute><ThermalStressHistory /></ProtectedRoute>} />
                <Route path="/drills" element={<ProtectedRoute><Drills /></ProtectedRoute>} />
                <Route path="/drills-history" element={<ProtectedRoute><DrillsHistory /></ProtectedRoute>} />
                <Route path="/risk-maps" element={<ProtectedRoute><RiskMapGenerator /></ProtectedRoute>} />
                <Route path="/risk-maps-history" element={<ProtectedRoute><RiskMapHistory /></ProtectedRoute>} />

                <Route path="/risk-matrix-history" element={<ProtectedRoute><History view="matrices" /></ProtectedRoute>} />
                <Route path="/reports-history" element={<ProtectedRoute><History view="reports" /></ProtectedRoute>} />
                <Route path="/matrices" element={<Navigate to="/risk-matrix" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Suspense>
          <Footer />
          <InstallBanner />
        </div>
      </SyncProvider>
    </AuthProvider >
  );
}

export default App;
