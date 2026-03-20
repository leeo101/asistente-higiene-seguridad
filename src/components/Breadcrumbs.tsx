import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

// Tipos
interface RouteMap {
  [key: string]: string;
}

interface BreadcrumbItem {
  to: string;
  name: string;
  isLast: boolean;
}

/**
 * Componente Breadcrumb - Muestra la ruta de navegación actual
 * Se integra automáticamente basado en la ruta actual
 */
export default function Breadcrumbs(): React.ReactElement | null {
  const location = useLocation();

  // Definir mapeo de rutas a nombres legibles
  const routeMap: RouteMap = {
    '/': 'Inicio',
    '/dashboard': 'Dashboard',
    '/ats': 'ATS',
    '/ats-history': 'Historial ATS',
    '/fire-load': 'Carga de Fuego',
    '/fire-load-history': 'Historial Carga de Fuego',
    '/lighting': 'Iluminación',
    '/lighting-history': 'Historial Iluminación',
    '/ergonomics': 'Ergonomía',
    '/thermal-stress': 'Estrés Térmico',
    '/risk-maps': 'Mapa de Riesgos',
    '/risk-maps-history': 'Historial Mapas',
    '/extinguishers': 'Matafuegos',
    '/extinguishers-history': 'Historial Matafuegos',
    '/work-permit': 'Permisos de Trabajo',
    '/work-permit-history': 'Historial Permisos',
    '/accident-investigation': 'Investigación de Accidentes',
    '/accident-investigation-history': 'Historial Accidentes',
    '/drills': 'Simulacros',
    '/drills-history': 'Historial Simulacros',
    '/stop-cards': 'Tarjetas STOP',
    '/stop-cards-history': 'Historial STOP',
    '/risk-assessment': 'Evaluación de Riesgos',
    '/risk-assessment-history': 'Historial Evaluaciones',
    '/risk-matrix': 'Matriz de Riesgos',
    '/risk-matrix-history': 'Historial Matrices',
    '/inspections': 'Inspecciones',
    '/inspections-history': 'Historial Inspecciones',
    '/checklists': 'Checklists',
    '/checklists-history': 'Historial Checklists',
    '/reports': 'Informes',
    '/reports-history': 'Historial Informes',
    '/ai-advisor': 'Asesor IA',
    '/ai-camera': 'Cámara IA',
    '/ai-general-camera': 'Riesgos IA',
    '/extinguisher-ai': 'Extintores IA',
    '/training-management': 'Capacitaciones',
    '/training-history': 'Historial Capacitaciones',
    '/ppe-tracker': 'Control EPP',
    '/legislation': 'Legislación',
    '/emergency-bot': 'Emergencias',
    '/personal-data': 'Datos Personales',
    '/profile': 'Perfil',
    '/security': 'Seguridad',
    '/settings': 'Configuración',
    '/subscription': 'Suscripción',
    '/history': 'Historial',
    '/privacy': 'Privacidad'
  };

  // Obtener segmentos de la ruta
  const pathnames = location.pathname.split('/').filter(x => x);

  // Si estamos en home, no mostrar breadcrumbs
  if (pathnames.length === 0) {
    return null;
  }

  // Construir breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = pathnames.map((value, index) => {
    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
    const name = routeMap[to] || decodeURIComponent(value).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const isLast = index === pathnames.length - 1;

    return {
      to,
      name,
      isLast
    };
  });

  return (
    <nav aria-label="Breadcrumb" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.85rem',
      color: 'var(--color-text-muted)',
      marginBottom: '1rem',
      flexWrap: 'wrap'
    }}>
      {/* Home link */}
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          color: 'var(--color-text-muted)',
          textDecoration: 'none',
          transition: 'color 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
        onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
      >
        <Home size={16} />
        <span style={{ fontWeight: 600 }}>Inicio</span>
      </Link>

      {/* Separadores y items */}
      {breadcrumbs.map((crumb) => (
        <React.Fragment key={crumb.to}>
          <ChevronRight size={16} color="var(--color-text-muted)" />

          {crumb.isLast ? (
            // Último item (página actual) - no clickable
            <span style={{
              fontWeight: 700,
              color: 'var(--color-text)',
              textDecoration: 'none'
            }}>
              {crumb.name}
            </span>
          ) : (
            // Items intermedios - clickable
            <Link
              to={crumb.to}
              style={{
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
            >
              {crumb.name}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
