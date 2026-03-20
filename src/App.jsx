import { Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Menu, Search, Cloud, CloudOff } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import NetworkBadge from './components/NetworkBadge';
import OfflineIndicator from './components/OfflineIndicator';
import Home from './pages/Home';
import Login from './pages/Login';
import InstallBanner from './components/InstallBanner';
import GlobalSearch from './components/GlobalSearch';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SyncProvider, useSync } from './contexts/SyncContext';
import { Toaster, toast } from 'react-hot-toast';
import { usePaywall } from './hooks/usePaywall';

// Custom lazy loader that catches chunk errors and reloads
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    let pageHasAlreadyBeenForceRefreshed = false;
    try {
      pageHasAlreadyBeenForceRefreshed = JSON.parse(
        window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
      );
    } catch (e) {
      console.error('[LAZY] Error parsing refresh flag:', e);
    }

    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        return window.location.reload();
      }
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
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard.jsx'));
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
const ExtinguishersHistory = lazyWithRetry(() => import('./pages/ExtinguishersHistory.jsx'));
const ExtinguisherPdfGenerator = lazyWithRetry(() => import('./components/ExtinguisherPdfGenerator.jsx'));
const ThermalStress = lazyWithRetry(() => import('./pages/ThermalStress.jsx'));
const ThermalStressHistory = lazyWithRetry(() => import('./pages/ThermalStressHistory.jsx'));
const Drills = lazyWithRetry(() => import('./pages/Drills.jsx'));
const DrillsHistory = lazyWithRetry(() => import('./pages/DrillsHistory.jsx'));
const RiskMapGenerator = lazyWithRetry(() => import('./pages/RiskMapGenerator.jsx'));
const RiskMapHistory = lazyWithRetry(() => import('./pages/RiskMapHistory.jsx'));
const StopCards = lazyWithRetry(() => import('./pages/StopCards.jsx'));
const StopCardsHistory = lazyWithRetry(() => import('./pages/StopCardsHistory.jsx'));
const LogoSettings = lazyWithRetry(() => import('./pages/LogoSettings.jsx'));
const PublicView = lazyWithRetry(() => import('./pages/PublicView.jsx'));
const EmergencyBot = lazyWithRetry(() => import('./pages/EmergencyBot.jsx'));
const ExtinguisherAI = lazyWithRetry(() => import('./pages/ExtinguisherAI.jsx'));
const ChemicalSafety = lazyWithRetry(() => import('./pages/ChemicalSafety.jsx'));
const NoiseAssessment = lazyWithRetry(() => import('./pages/NoiseAssessment.jsx'));
const NoiseAssessmentPage = lazyWithRetry(() => import('./pages/NoiseAssessmentPage.jsx'));
const LOTOManager = lazyWithRetry(() => import('./pages/LOTOManager.jsx'));
const LOTOPage = lazyWithRetry(() => import('./pages/LOTOPage.jsx'));
const ConfinedSpace = lazyWithRetry(() => import('./pages/ConfinedSpace.jsx'));
const ConfinedSpacePage = lazyWithRetry(() => import('./pages/ConfinedSpacePage.jsx'));
const WorkingAtHeight = lazyWithRetry(() => import('./pages/WorkingAtHeight.jsx'));
const WorkingAtHeightPage = lazyWithRetry(() => import('./pages/WorkingAtHeightPage.jsx'));
const AuditManager = lazyWithRetry(() => import('./pages/AuditManager.jsx'));
const AuditPage = lazyWithRetry(() => import('./pages/AuditPage.jsx'));
const CAPAManager = lazyWithRetry(() => import('./pages/CAPAManager.jsx'));
const CAPAPage = lazyWithRetry(() => import('./pages/CAPAPage.jsx'));
const EnvironmentalMonitor = lazyWithRetry(() => import('./pages/EnvironmentalMonitor.jsx'));
const EnvironmentalPage = lazyWithRetry(() => import('./pages/EnvironmentalPage.jsx'));

// SAFETY MODULE FORMS
const AuditForm = lazyWithRetry(() => import('./pages/AuditForm'));
const CAPAForm = lazyWithRetry(() => import('./pages/CAPAForm'));
const EnvironmentalForm = lazyWithRetry(() => import('./pages/EnvironmentalForm'));
const LOTOForm = lazyWithRetry(() => import('./pages/LOTOForm'));
const NoiseAssessmentForm = lazyWithRetry(() => import('./pages/NoiseAssessmentForm'));
const WorkingAtHeightForm = lazyWithRetry(() => import('./pages/WorkingAtHeightForm'));
const ConfinedSpaceForm = lazyWithRetry(() => import('./pages/ConfinedSpaceForm'));
const ChemicalSafetyForm = lazyWithRetry(() => import('./pages/ChemicalSafetyForm'));

// SAFETY MODULE HISTORY
const AuditHistory = lazyWithRetry(() => import('./pages/AuditHistory'));
const CAPAHistory = lazyWithRetry(() => import('./pages/CAPAHistory'));
const EnvironmentalHistory = lazyWithRetry(() => import('./pages/EnvironmentalHistory'));
const LOTOHistory = lazyWithRetry(() => import('./pages/LOTOHistory'));
const NoiseAssessmentHistory = lazyWithRetry(() => import('./pages/NoiseAssessmentHistory'));
const WorkingAtHeightHistory = lazyWithRetry(() => import('./pages/WorkingAtHeightHistory'));
const ConfinedSpaceHistory = lazyWithRetry(() => import('./pages/ConfinedSpaceHistory'));
const ChemicalSafetyHistory = lazyWithRetry(() => import('./pages/ChemicalSafetyHistory'));

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
          color: '#fbbf24',
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
    window.scrollTo(0, 0);
    const timeout = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    }, 10);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const showMenuButton = location.pathname !== '/login' && location.pathname !== '/subscribe' && location.pathname !== '/ai-camera';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

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
        <ScrollToTop />
        <GlobalPrintGuard />
        <NetworkBadge />
        <OfflineIndicator />
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
            success: { style: { background: '#10b981', color: '#fff' } },
            error: { style: { background: '#ef4444', color: '#fff' } },
          }}
        />
        <div className="app-container">
          {showMenuButton && (
            <div
              className="glass-panel no-print"
              style={{
                position: 'fixed',
                top: '1rem',
                left: '1rem',
                right: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                zIndex: 10,
                padding: '0.75rem 1.25rem',
                background: 'var(--glass-bg-header)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: 'var(--radius-2xl)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-shadow)',
                transition: 'all var(--transition-base)'
              }}>
              <button
                onClick={() => setIsSidebarOpen(true)}
                style={{
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.6rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all var(--transition-base)'
                }}
              >
                <Menu size={22} strokeWidth={2.5} />
              </button>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', color: 'var(--color-text)', flex: 1, transition: 'opacity var(--transition-fast)' }}>
                <img src="/logo.png" alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(59, 130, 246, 0.2))' }} />
                <h1 className="header-title" style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>Asistente HYS</h1>
              </Link>
              <button
                onClick={() => setIsSearchOpen(true)}
                title="Buscar (Ctrl+K)"
                style={{
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.6rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-muted)',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all var(--transition-base)'
                }}
              >
                <Search size={20} strokeWidth={2.5} />
              </button>
              <CloudStatusIndicator />
            </div>
          )}

          {isSearchOpen && <GlobalSearch onClose={() => setIsSearchOpen(false)} />}

          <div className="no-print">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          </div>

          <Suspense fallback={<LoadingScreen />}>
            <div key={location.pathname} className="page-transition" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Routes location={location}>
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/subscribe" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/v/:uid/:cat/:id" element={<PublicView />} />

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
                <Route path="/emergency-bot" element={<EmergencyBot />} />
                <Route path="/extinguisher-ai" element={<ExtinguisherAI />} />

                {/* Safety Module Pages */}
                <Route path="/chemical-safety" element={<ChemicalSafety />} />
                <Route path="/chemical-safety-create" element={<ChemicalSafetyCreate />} />
                <Route path="/noise-assessment" element={<NoiseAssessment />} />
                <Route path="/noise-assessment-create" element={<NoiseAssessmentCreate />} />
                <Route path="/noise-assessment-page" element={<NoiseAssessmentPage />} />
                <Route path="/confined-space" element={<ConfinedSpace />} />
                <Route path="/confined-space-create" element={<ConfinedSpaceCreate />} />
                <Route path="/confined-space-page" element={<ConfinedSpacePage />} />
                <Route path="/working-at-height" element={<WorkingAtHeight />} />
                <Route path="/working-at-height-create" element={<WorkingAtHeightCreate />} />
                <Route path="/working-at-height-page" element={<WorkingAtHeightPage />} />
                <Route path="/audit" element={<AuditManager />} />
                <Route path="/audit-create" element={<AuditCreate />} />
                <Route path="/audit/:id" element={<AuditDetail />} />
                <Route path="/audit-page" element={<AuditPage />} />
                <Route path="/capa" element={<CAPAManager />} />
                <Route path="/capa-create" element={<CAPACreate />} />
                <Route path="/capa-page" element={<CAPAPage />} />
                <Route path="/environmental" element={<EnvironmentalMonitor />} />
                <Route path="/environmental-create" element={<EnvironmentalCreate />} />
                <Route path="/environmental-page" element={<EnvironmentalPage />} />

                {/* Safety Module Forms (NEW structure) */}
                <Route path="/audit/new" element={<AuditForm />} />
                <Route path="/capa/new" element={<CAPAForm />} />
                <Route path="/environmental/new" element={<EnvironmentalForm />} />
                <Route path="/loto/new" element={<LOTOForm />} />
                <Route path="/noise-assessment/new" element={<NoiseAssessmentForm />} />
                <Route path="/working-at-height/new" element={<WorkingAtHeightForm />} />
                <Route path="/confined-space/new" element={<ConfinedSpaceForm />} />
                <Route path="/chemical-safety/new" element={<ChemicalSafetyForm />} />

                {/* Safety Module Forms (Compatibility) */}
                <Route path="/audit-form" element={<AuditForm />} />
                <Route path="/capa-form" element={<CAPAForm />} />
                <Route path="/environmental-form" element={<EnvironmentalForm />} />
                <Route path="/loto-form" element={<LOTOForm />} />
                <Route path="/noise-assessment-form" element={<NoiseAssessmentForm />} />
                <Route path="/working-at-height-form" element={<WorkingAtHeightForm />} />
                <Route path="/confined-space-form" element={<ConfinedSpaceForm />} />
                <Route path="/chemical-safety-form" element={<ChemicalSafetyForm />} />

                {/* Safety Module History */}
                <Route path="/audit-history" element={<AuditHistory />} />
                <Route path="/capa-history" element={<CAPAHistory />} />
                <Route path="/environmental-history" element={<EnvironmentalHistory />} />
                <Route path="/loto-history" element={<LOTOHistory />} />
                <Route path="/noise-assessment-history" element={<NoiseAssessmentHistory />} />
                <Route path="/working-at-height-history" element={<WorkingAtHeightHistory />} />
                <Route path="/confined-space-history" element={<ConfinedSpaceHistory />} />
                <Route path="/chemical-safety-history" element={<ChemicalSafetyHistory />} />

                <Route path="/calendar" element={<SafetyCalendar />} />
                <Route path="/ai-camera-history" element={<AICameraHistory />} />
                <Route path="/lighting" element={<LightingReport />} />

                {/* Dashboard & Tools */}
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
                <Route path="/extinguishers-history" element={<ProtectedRoute><ExtinguishersHistory /></ProtectedRoute>} />
                <Route path="/ats-history" element={<ProtectedRoute><ATSHistory /></ProtectedRoute>} />
                <Route path="/fire-load-history" element={<ProtectedRoute><FireLoadHistory /></ProtectedRoute>} />
                <Route path="/checklists-history" element={<ProtectedRoute><ChecklistsHistory /></ProtectedRoute>} />
                <Route path="/lighting-history" element={<ProtectedRoute><LightingHistory /></ProtectedRoute>} />
                <Route path="/work-permit" element={<ProtectedRoute><WorkPermit /></ProtectedRoute>} />
                <Route path="/work-permit-history" element={<ProtectedRoute><WorkPermitHistory /></ProtectedRoute>} />
                <Route path="/risk-assessment-history" element={<ProtectedRoute><RiskAssessmentHistory /></ProtectedRoute>} />
                <Route path="/admin/requests" element={<ProtectedRoute><AdminRequests /></ProtectedRoute>} />
                <Route path="/PPE-tracker" element={<ProtectedRoute><PPETracker /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/management-report" element={<ProtectedRoute><ManagementReport /></ProtectedRoute>} />
                <Route path="/accident-investigation" element={<ProtectedRoute><AccidentInvestigation /></ProtectedRoute>} />
                <Route path="/accident-history" element={<ProtectedRoute><AccidentHistory /></ProtectedRoute>} />
                <Route path="/training-management" element={<ProtectedRoute><TrainingManagement /></ProtectedRoute>} />
                <Route path="/training-history" element={<ProtectedRoute><TrainingHistory /></ProtectedRoute>} />
                <Route path="/extinguishers" element={<ProtectedRoute><Extinguishers /></ProtectedRoute>} />
                <Route path="/thermal-stress" element={<ProtectedRoute><ThermalStress /></ProtectedRoute>} />
                <Route path="/thermal-stress-history" element={<ProtectedRoute><ThermalStressHistory /></ProtectedRoute>} />
                <Route path="/drills" element={<ProtectedRoute><Drills /></ProtectedRoute>} />
                <Route path="/drills-history" element={<ProtectedRoute><DrillsHistory /></ProtectedRoute>} />
                <Route path="/risk-maps" element={<ProtectedRoute><RiskMapGenerator /></ProtectedRoute>} />
                <Route path="/risk-maps-history" element={<ProtectedRoute><RiskMapHistory /></ProtectedRoute>} />
                <Route path="/stop-cards" element={<ProtectedRoute><StopCards /></ProtectedRoute>} />
                <Route path="/stop-cards-history" element={<ProtectedRoute><StopCardsHistory /></ProtectedRoute>} />
                <Route path="/logo-settings" element={<ProtectedRoute><LogoSettings /></ProtectedRoute>} />

                <Route path="/risk-matrix-history" element={<ProtectedRoute><History view="matrices" /></ProtectedRoute>} />
                <Route path="/reports-history" element={<ProtectedRoute><History view="reports" /></ProtectedRoute>} />
                <Route path="/matrices" element={<Navigate to="/risk-matrix" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Suspense>
          <div className="no-print">
            <Footer />
            <InstallBanner />
          </div>
        </div>
      </SyncProvider>
    </AuthProvider >
  );
}

export default App;
