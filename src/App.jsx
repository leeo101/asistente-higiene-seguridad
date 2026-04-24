import { Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import React, { useEffect, useState, Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import { List as Menu, MagnifyingGlass as Search, Cloud, CloudSlash as CloudOff } from '@phosphor-icons/react';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import NetworkBadge from './components/NetworkBadge';
import OfflineIndicator from './components/OfflineIndicator';
import FloatingAssistant from './components/FloatingAssistant';
import Home from './pages/Home';
import Login from './pages/Login';
import InstallBanner from './components/InstallBanner';
import GlobalSearch from './components/GlobalSearch';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SyncProvider, useSync } from './contexts/SyncContext';
import { Toaster, toast } from 'react-hot-toast';
import { usePaywall } from './hooks/usePaywall';
import ModuleGuard from './components/ModuleGuard';


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
      console.error('[LAZY] CRITICAL: Failed to load module!', error);
      if (!pageHasAlreadyBeenForceRefreshed) {
        console.warn('[LAZY] Attempting force refresh to recover from chunk failure...');
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
        return { default: () => null }; // Return dummy to satisfy lazy
      }
      throw error;
    }
  });

// LAZY LOADED PAGES
const CreateInspection = lazyWithRetry(() => import('./pages/CreateInspection'));
const Checklist = lazyWithRetry(() => import('./pages/Checklist'));
const Observation = lazyWithRetry(() => import('./pages/Observation'));
const Photos = lazyWithRetry(() => import('./pages/Photos'));
const RiskAssessment = lazyWithRetry(() => import('./pages/RiskAssessment'));
const History = lazyWithRetry(() => import('./pages/History'));
const Report = lazyWithRetry(() => import('./pages/Report'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const PersonalData = lazyWithRetry(() => import('./pages/PersonalData'));
const SignatureStamp = lazyWithRetry(() => import('./pages/SignatureStamp'));
const Security = lazyWithRetry(() => import('./pages/Security'));
const AppSettings = lazyWithRetry(() => import('./pages/AppSettings'));
const ATS = lazyWithRetry(() => import('./pages/ATS'));
const ATSHistory = lazyWithRetry(() => import('./pages/ATSHistory'));
const FireLoad = lazyWithRetry(() => import('./pages/FireLoad'));
const FireLoadHistory = lazyWithRetry(() => import('./pages/FireLoadHistory'));
const RiskMatrix = lazyWithRetry(() => import('./pages/RiskMatrix'));
const RiskMatrixReport = lazyWithRetry(() => import('./pages/RiskMatrixReport'));
const Reports = lazyWithRetry(() => import('./pages/Reports'));
const ReportsReport = lazyWithRetry(() => import('./pages/ReportsReport'));
const AICamera = lazyWithRetry(() => import('./pages/AICamera'));
const AIGeneralCamera = lazyWithRetry(() => import('./pages/AIGeneralCamera'));
const AIChatAdvisor = lazyWithRetry(() => import('./pages/AIChatAdvisor'));
const AIReport = lazyWithRetry(() => import('./pages/AIReport'));
const Legislation = lazyWithRetry(() => import('./pages/Legislation'));
const Ergonomics = lazyWithRetry(() => import('./pages/Ergonomics'));
const ErgonomicsForm = lazyWithRetry(() => import('./pages/ErgonomicsForm'));
const ErgonomicsReport = lazyWithRetry(() => import('./pages/ErgonomicsReport'));
const SafetyCalendar = lazyWithRetry(() => import('./pages/SafetyCalendar'));
const ResetPassword = lazyWithRetry(() => import('./pages/ResetPassword'));
const AdminRequests = lazyWithRetry(() => import('./pages/AdminRequests'));
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'));
const LightingReport = lazyWithRetry(() => import('./pages/LightingReport'));
const LightingHistory = lazyWithRetry(() => import('./pages/LightingHistory'));
const WorkPermit = lazyWithRetry(() => import('./pages/WorkPermit'));
const WorkPermitHistory = lazyWithRetry(() => import('./pages/WorkPermitHistory'));
const RiskAssessmentHistory = lazyWithRetry(() => import('./pages/RiskAssessmentHistory'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));
const PPETracker = lazyWithRetry(() => import('./pages/PPETracker'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const ChecklistsHistory = lazyWithRetry(() => import('./pages/ChecklistsHistory'));
const ChecklistManager = lazyWithRetry(() => import('./pages/ChecklistManager'));
const Subscription = lazyWithRetry(() => import('./pages/Subscription'));
const AIHistory = lazyWithRetry(() => import('./pages/AIHistory'));
const AICameraHistory = lazyWithRetry(() => import('./pages/AICameraHistory'));
const ManagementReport = lazyWithRetry(() => import('./pages/ManagementReport'));
const AccidentInvestigation = lazyWithRetry(() => import('./pages/AccidentInvestigation'));
const AccidentHistory = lazyWithRetry(() => import('./pages/AccidentHistory'));
const TrainingManagement = lazyWithRetry(() => import('./pages/TrainingManagement'));
const TrainingHistory = lazyWithRetry(() => import('./pages/TrainingHistory'));
const Extinguishers = lazyWithRetry(() => import('./pages/Extinguishers'));
const ExtinguishersHistory = lazyWithRetry(() => import('./pages/ExtinguishersHistory'));
const ExtinguisherPdfGenerator = lazyWithRetry(() => import('./components/ExtinguisherPdfGenerator'));
const ThermalStress = lazyWithRetry(() => import('./pages/ThermalStress'));
const ThermalStressHistory = lazyWithRetry(() => import('./pages/ThermalStressHistory'));
const Drills = lazyWithRetry(() => import('./pages/Drills'));
const DrillsHistory = lazyWithRetry(() => import('./pages/DrillsHistory'));
const RiskMapGenerator = lazyWithRetry(() => import('./pages/RiskMapGenerator'));
const RiskMapHistory = lazyWithRetry(() => import('./pages/RiskMapHistory'));
const StopCards = lazyWithRetry(() => import('./pages/StopCards'));
const StopCardsHistory = lazyWithRetry(() => import('./pages/StopCardsHistory'));
const LogoSettings = lazyWithRetry(() => import('./pages/LogoSettings'));
const PublicView = lazyWithRetry(() => import('./pages/PublicView'));
const ExtinguisherAI = lazyWithRetry(() => import('./pages/ExtinguisherAI'));
const ChemicalSafety = lazyWithRetry(() => import('./pages/ChemicalSafety'));
const NoiseAssessment = lazyWithRetry(() => import('./pages/NoiseAssessment'));
const LOTOManager = lazyWithRetry(() => import('./pages/LOTOManager'));
const ConfinedSpace = lazyWithRetry(() => import('./pages/ConfinedSpace'));
const WorkingAtHeight = lazyWithRetry(() => import('./pages/WorkingAtHeight'));
const AuditManager = lazyWithRetry(() => import('./pages/AuditManager'));
const CAPAManager = lazyWithRetry(() => import('./pages/CAPAManager'));
const EnvironmentalMonitor = lazyWithRetry(() => import('./pages/EnvironmentalMonitor'));
const SafetyKPIs = lazyWithRetry(() => import('./pages/SafetyKPIs'));
const ToolboxTalk = lazyWithRetry(() => import('./pages/ToolboxTalk'));
const ContractorManagement = lazyWithRetry(() => import('./pages/ContractorManagement'));

// SAFETY MODULE FORMS
const AuditForm = lazyWithRetry(() => import('./pages/AuditForm'));
const AuditDetail = lazyWithRetry(() => import('./pages/AuditDetail'));
const CAPAForm = lazyWithRetry(() => import('./pages/CAPAForm'));
const EnvironmentalForm = lazyWithRetry(() => import('./pages/EnvironmentalForm'));
const LOTOForm = lazyWithRetry(() => import('./pages/LOTOForm'));
const NoiseAssessmentForm = lazyWithRetry(() => import('./pages/NoiseAssessmentForm'));
const WorkingAtHeightForm = lazyWithRetry(() => import('./pages/WorkingAtHeightForm'));
const ConfinedSpaceForm = lazyWithRetry(() => import('./pages/ConfinedSpaceForm'));
const ChemicalSafetyForm = lazyWithRetry(() => import('./pages/ChemicalSafetyForm'));



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
    // Aplicar clase al body para el bloqueo por CSS (@media print)
    if (typeof document !== 'undefined') {
      if (!isPro) {
        document.body.classList.add('not-pro-user');
      } else {
        document.body.classList.remove('not-pro-user');
      }
    }

    const handleKeyDown = (e) => {
      // Bloquear Ctrl+P y Cmd+P
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        if (!isPro) {
          e.preventDefault();
          e.stopPropagation();
          toast.error('Impresión y exportación exclusivas para miembros PRO 💎', {
            id: 'print-blocked-toast',
            duration: 4000,
            icon: '⚠️',
            style: {
              borderRadius: '12px',
              background: '#1e293b',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '700',
              border: '1px solid rgba(59,130,246,0.3)',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.4)'
            }
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (typeof document !== 'undefined') {
        document.body.classList.remove('not-pro-user');
      }
    };
  }, [isPro]);

  return null;
}

function ThemeApplier() {
  const { currentUser } = useAuth();

  useEffect(() => {
    const applyColors = (primary, secondary) => {
        if (typeof document === 'undefined') return;
        if (primary) {
           document.documentElement.style.setProperty('--color-primary', primary);
           const hex = primary.replace('#', '');
           if (hex.length === 6) {
               const r = parseInt(hex.substring(0, 2), 16);
               const g = parseInt(hex.substring(2, 4), 16);
               const b = parseInt(hex.substring(4, 6), 16);
               document.documentElement.style.setProperty('--color-primary-rgb', `${r}, ${g}, ${b}`);
           }
        } else {
           document.documentElement.style.removeProperty('--color-primary');
           document.documentElement.style.removeProperty('--color-primary-rgb');
        }
        if (secondary) {
           document.documentElement.style.setProperty('--color-secondary', secondary);
        } else {
           document.documentElement.style.removeProperty('--color-secondary');
        }
    };

    const localPrimary = localStorage.getItem('primaryColor');
    const localSecondary = localStorage.getItem('secondaryColor');
    applyColors(localPrimary, localSecondary);

    if (currentUser?.uid) {
        import('./services/cloudSync').then(({ listenToValue }) => {
            const unsubPrimary = listenToValue(currentUser.uid, 'primaryColor', (val) => {
                if (val) localStorage.setItem('primaryColor', val);
                else localStorage.removeItem('primaryColor');
                applyColors(val, localStorage.getItem('secondaryColor'));
            });
            const unsubSecondary = listenToValue(currentUser.uid, 'secondaryColor', (val) => {
                if (val) localStorage.setItem('secondaryColor', val);
                else localStorage.removeItem('secondaryColor');
                applyColors(localStorage.getItem('primaryColor'), val);
            });
            // We cannot easily unsubscribe here due to dynamic import, but that's ok for global app component
        });
    }
  }, [currentUser]);

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
  const { syncing, lastSync, pendingCount } = useSync();
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
        title={`${pendingCount > 0 ? `${pendingCount} cambios pendientes de subir` : 'Sin conexión (guardado local)'}`}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          fontSize: '0.65rem', fontWeight: 800,
          color: '#fbbf24',
          flexShrink: 0, whiteSpace: 'nowrap',
          background: 'rgba(251,191,36,0.1)',
          padding: '0.2rem 0.5rem',
          borderRadius: '8px',
          border: '1px solid rgba(251,191,36,0.2)'
        }}
      >
        <CloudOff weight="bold" size={18} />
        <span className="header-title">{pendingCount > 0 ? `Pendiente (${pendingCount})` : 'Offline'}</span>
      </div>
    );
  }

  return (
    <div
      title={syncing ? 'Sincronizando...' : lastSync ? `Sincronizado ${lastSync.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}` : 'Conectado a la nube'}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        fontSize: '0.65rem', fontWeight: 800,
        color: syncing ? '#93c5fd' : '#86efac',
        flexShrink: 0, whiteSpace: 'nowrap',
        background: syncing ? 'rgba(59,130,246,0.1)' : 'rgba(134,239,172,0.1)',
        padding: '0.2rem 0.5rem',
        borderRadius: '8px',
        border: syncing ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(134,239,172,0.2)'
      }}
    >
      {syncing ? (
        <>
          <Cloud weight={syncing ? 'duotone' : 'bold'} size={18} className={syncing ? 'loading-spin' : ''} />
          <span className="header-title">{pendingCount > 0 ? `Subiendo (${pendingCount})` : 'Sync...'}</span>
        </>
      ) : (
        <>
          <Cloud size={16} />
          <span className="header-title" style={{ display: 'none' }}>Conectado</span>
        </>
      )}
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
        <ThemeApplier />
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
        <div className="app-container" style={{ position: 'relative' }}>
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
                <Menu weight="bold" size={22} />
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
                <Search weight="bold" size={20} />
              </button>
              <CloudStatusIndicator />
            </div>
          )}

          {isSearchOpen && <GlobalSearch onClose={() => setIsSearchOpen(false)} />}

          <div className="no-print">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          </div>

          <Suspense fallback={<LoadingScreen />}>
            <div className="page-transition" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/subscribe" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/v/:uid/:cat/:id" element={<PublicView />} />

                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/ats" element={<ModuleGuard><ATS /></ModuleGuard>} />
                  <Route path="/fire-load" element={<ModuleGuard><FireLoad /></ModuleGuard>} />

                  <Route path="/legislation" element={<Legislation />} />
                  <Route path="/checklists" element={<ChecklistManager />} />
                  <Route path="/create-inspection" element={<CreateInspection />} />
                  <Route path="/checklist" element={<Checklist />} />
                  <Route path="/observation" element={<Observation />} />
                  <Route path="/photos" element={<Photos />} />
                  <Route path="/ai-camera" element={<ModuleGuard><AICamera /></ModuleGuard>} />
                  <Route path="/ai-general-camera" element={<ModuleGuard><AIGeneralCamera /></ModuleGuard>} />
                  <Route path="/ai-advisor" element={<ModuleGuard><AIChatAdvisor /></ModuleGuard>} />
                  <Route path="/ai-history" element={<ModuleGuard><AIHistory /></ModuleGuard>} />
                  <Route path="/ai-report" element={<ModuleGuard><AIReport /></ModuleGuard>} />
                  <Route path="/extinguisher-ai" element={<ModuleGuard><ExtinguisherAI /></ModuleGuard>} />

                  {/* Safety Modules */}
                  <Route path="/audit" element={<ModuleGuard><AuditManager /></ModuleGuard>} />
                  <Route path="/audit/new" element={<ModuleGuard><AuditForm /></ModuleGuard>} />
                  <Route path="/audit/:id" element={<ModuleGuard><AuditDetail /></ModuleGuard>} />
                  
                  <Route path="/capa" element={<ModuleGuard><CAPAManager /></ModuleGuard>} />
                  <Route path="/capa/new" element={<ModuleGuard><CAPAForm /></ModuleGuard>} />
                  
                  <Route path="/environmental" element={<ModuleGuard><EnvironmentalMonitor /></ModuleGuard>} />
                  <Route path="/environmental/new" element={<ModuleGuard><EnvironmentalForm /></ModuleGuard>} />
                  
                  <Route path="/loto" element={<ModuleGuard><LOTOManager /></ModuleGuard>} />
                  <Route path="/loto/new" element={<ModuleGuard><LOTOForm /></ModuleGuard>} />
                  
                  <Route path="/noise-assessment" element={<ModuleGuard><NoiseAssessment /></ModuleGuard>} />
                  <Route path="/noise-assessment/new" element={<ModuleGuard><NoiseAssessmentForm /></ModuleGuard>} />
                  
                  <Route path="/working-at-height" element={<ModuleGuard><WorkingAtHeight /></ModuleGuard>} />
                  <Route path="/working-at-height/new" element={<ModuleGuard><WorkingAtHeightForm /></ModuleGuard>} />
                  
                  <Route path="/confined-space" element={<ModuleGuard><ConfinedSpace /></ModuleGuard>} />
                  <Route path="/confined-space/new" element={<ModuleGuard><ConfinedSpaceForm /></ModuleGuard>} />
                  
                  <Route path="/chemical-safety" element={<ModuleGuard><ChemicalSafety /></ModuleGuard>} />
                  <Route path="/chemical-safety/new" element={<ModuleGuard><ChemicalSafetyForm /></ModuleGuard>} />

                  <Route path="/safety-kpis" element={<ProtectedRoute><SafetyKPIs /></ProtectedRoute>} />
                  <Route path="/toolbox-talk" element={<ProtectedRoute><ToolboxTalk /></ProtectedRoute>} />
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
                  <Route path="/contractors" element={<ProtectedRoute><ContractorManagement /></ProtectedRoute>} />

                  <Route path="/risk-matrix-history" element={<ProtectedRoute><History view="matrices" /></ProtectedRoute>} />
                  <Route path="/reports-history" element={<ProtectedRoute><History view="reports" /></ProtectedRoute>} />
                  <Route path="/matrices" element={<Navigate to="/risk-matrix" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AnimatePresence>
            </div>
          </Suspense>
          <div className="no-print">
            <Footer />
            <InstallBanner />
          </div>
          <FloatingAssistant />
        </div>
      </SyncProvider>
    </AuthProvider >
  );
}

export default App;
