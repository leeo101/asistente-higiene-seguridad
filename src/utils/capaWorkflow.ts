import toast from 'react-hot-toast';

export interface CAPAItem {
  id: string;
  title: string;
  description: string;
  sourceModule: 'extingushers' | 'checklists' | 'risk_matrix' | 'accidents' | 'audits' | 'manual';
  severity: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  location: string;
  assignedTo: string;
  dueDate: string;
  status: 'Pendiente' | 'En Proceso' | 'Verificado' | 'Cerrado';
  createdAt: string;
  preventiveAction?: string;
  correctiveAction?: string;
  evidencePhoto?: string;
}

/**
  Crea una Acción Correctiva/Preventiva (CAPA) a partir de un hallazgo o falla en una inspección
 */
export function createCAPAFromFinding(params: {
  title: string;
  description: string;
  sourceModule: CAPAItem['sourceModule'];
  severity?: CAPAItem['severity'];
  location?: string;
  assignedTo?: string;
  dueDateDays?: number;
  preventiveAction?: string;
  correctiveAction?: string;
  evidencePhoto?: string;
}): CAPAItem {
  const {
    title,
    description,
    sourceModule,
    severity = 'Alta',
    location = 'Planta Principal',
    assignedTo = 'Responsable de Seguridad',
    dueDateDays = 15,
    preventiveAction,
    correctiveAction,
    evidencePhoto
  } = params;

  const dueDate = new Date(Date.now() + dueDateDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const newCAPA: CAPAItem = {
    id: `CAPA-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
    title,
    description,
    sourceModule,
    severity,
    location,
    assignedTo,
    dueDate,
    status: 'Pendiente',
    createdAt: new Date().toISOString(),
    preventiveAction: preventiveAction || 'Revisar procedimiento operativo y capacitar al personal del área.',
    correctiveAction: correctiveAction || 'Reemplazar o reparar inmediatamente el equipo despresurizado o no conforme.',
    evidencePhoto
  };

  try {
    const existingStr = localStorage.getItem('ehs_capa_db') || '[]';
    const existing: CAPAItem[] = JSON.parse(existingStr);
    const updated = [newCAPA, ...existing];
    localStorage.setItem('ehs_capa_db', JSON.stringify(updated));
    toast.success(`Acción Correctiva ${newCAPA.id} generada automáticamente`);
  } catch (err) {
    console.error('[CAPA WORKFLOW] Error guardando CAPA:', err);
  }

  return newCAPA;
}

/**
  Obtiene todas las CAPAs pendientes de resolución
 */
export function getPendingCAPAs(): CAPAItem[] {
  try {
    const existingStr = localStorage.getItem('ehs_capa_db') || '[]';
    const existing: CAPAItem[] = JSON.parse(existingStr);
    return existing.filter(c => c.status === 'Pendiente' || c.status === 'En Proceso');
  } catch (e) {
    return [];
  }
}
