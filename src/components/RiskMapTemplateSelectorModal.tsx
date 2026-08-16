import React from 'react';
import { 
  Building2, Flame, Zap, ShieldAlert, Sparkles, X, Layout, Factory, 
  Warehouse, Briefcase, HardHat, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface PlanElement {
  id: string;
  type: 'rect' | 'line' | 'text' | 'icon';
  x: number;
  y: number;
  w?: number;
  h?: number;
  x2?: number;
  y2?: number;
  text?: string;
  color?: string;
  iconId?: string;
  strokeWidth?: number;
}

export interface PlanTemplate {
  id: string;
  name: string;
  sector: string;
  description: string;
  icon: React.ReactNode;
  elements: PlanElement[];
}

interface RiskMapTemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (elements: PlanElement[], templateMeta: { sector: string; name: string }) => void;
}

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: 'industrial_plant',
    name: 'Planta Industrial / Taller Mecánico',
    sector: 'Sector Metalmecánico / Producción',
    description: 'Estructura perimetral, zonas de maquinaria pesada, tableros eléctricos, extintores ABC y ruta de evacuación.',
    icon: <Factory className="text-amber-400" size={28} />,
    elements: [
      // Paredes Perimetrales
      { id: 'w1', type: 'rect', x: 100, y: 100, w: 600, h: 360, color: '#334155', strokeWidth: 4 },
      // Divisiones Internas
      { id: 'w2', type: 'line', x: 100, y: 280, x2: 450, y2: 280, color: '#475569', strokeWidth: 3 },
      { id: 'w3', type: 'line', x: 450, y: 100, x2: 450, y2: 460, color: '#475569', strokeWidth: 3 },
      // Etiquetas de Sector
      { id: 't1', type: 'text', x: 120, y: 120, text: 'ZONA 1: MECANIZADO Y TORNERÍA', color: '#cbd5e1' },
      { id: 't2', type: 'text', x: 120, y: 300, text: 'ZONA 2: DEPO DE MATERIA PRIMA', color: '#cbd5e1' },
      { id: 't3', type: 'text', x: 470, y: 120, text: 'ZONA 3: ENSAMBLE Y CONTROL', color: '#cbd5e1' },
      // Señalética e Íconos de Riesgo
      { id: 'i1', type: 'icon', iconId: 'fire_extinguisher', x: 110, y: 260, color: '#ef4444' },
      { id: 'i2', type: 'icon', iconId: 'fire_extinguisher', x: 680, y: 260, color: '#ef4444' },
      { id: 'i3', type: 'icon', iconId: 'elec_risk', x: 430, y: 120, color: '#f59e0b' },
      { id: 'i4', type: 'icon', iconId: 'you_are_here', x: 120, y: 440, color: '#10b981' }
    ]
  },
  {
    id: 'chemical_warehouse',
    name: 'Depósito & Almacén de Inflamables',
    sector: 'Almacén de Sustancias Peligrosas',
    description: 'Estanterías perimetrales, duchas/lavaojos de emergencia, extintores CO2 y señalización de riesgo químico.',
    icon: <Warehouse className="text-rose-400" size={28} />,
    elements: [
      { id: 'w1', type: 'rect', x: 120, y: 100, w: 560, h: 360, color: '#334155', strokeWidth: 4 },
      { id: 't1', type: 'text', x: 140, y: 120, text: 'SECTOR A: DEPOSITO INFLAMABLES', color: '#fca5a5' },
      { id: 'i1', type: 'icon', iconId: 'chem_hazard', x: 150, y: 160, color: '#f59e0b' },
      { id: 'i2', type: 'icon', iconId: 'fire_extinguisher', x: 660, y: 110, color: '#ef4444' },
      { id: 'i3', type: 'icon', iconId: 'eyewash', x: 660, y: 430, color: '#10b981' }
    ]
  },
  {
    id: 'administrative_office',
    name: 'Oficinas Administrativas & Servidores',
    sector: 'Área Administrativa',
    description: 'Oficinas modulares, sala de servidores (Rack), cocina/comedor, extintores de gas limpio y rutas de salida.',
    icon: <Briefcase className="text-blue-400" size={28} />,
    elements: [
      { id: 'w1', type: 'rect', x: 100, y: 100, w: 600, h: 340, color: '#334155', strokeWidth: 4 },
      { id: 't1', type: 'text', x: 120, y: 120, text: 'SALA DE SERVIDORES Y RACKS', color: '#93c5fd' },
      { id: 'i1', type: 'icon', iconId: 'fire_co2', x: 120, y: 160, color: '#3b82f6' },
      { id: 'i2', type: 'icon', iconId: 'exit_left', x: 670, y: 110, color: '#10b981' }
    ]
  },
  {
    id: 'construction_site',
    name: 'Obra en Construcción & Estructuras',
    sector: 'Fase de Hormigonado / Estructura',
    description: 'Cerco perimetral, zona de acopio de hierro, grúa torre, tableros de obra y uso obligatorio de EPP.',
    icon: <HardHat className="text-emerald-400" size={28} />,
    elements: [
      { id: 'w1', type: 'rect', x: 80, y: 80, w: 640, h: 400, color: '#334155', strokeWidth: 3 },
      { id: 't1', type: 'text', x: 100, y: 100, text: 'ZONA DE IZAJE Y GRÚA TORRE', color: '#fde047' },
      { id: 'i1', type: 'icon', iconId: 'overhead_crane', x: 110, y: 140, color: '#f59e0b' },
      { id: 'i2', type: 'icon', iconId: 'ppe_mandatory', x: 690, y: 90, color: '#2563eb' }
    ]
  }
];

export const RiskMapTemplateSelectorModal: React.FC<RiskMapTemplateSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  if (!isOpen) return null;

  const handleSelect = (tmpl: PlanTemplate) => {
    onSelectTemplate(tmpl.elements, { sector: tmpl.sector, name: tmpl.name });
    toast.success(`Plantilla "${tmpl.name}" cargada en el lienzo`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
              <Layout size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white m-0 flex items-center gap-2">
                Plantillas de Planos de Planta e Inspección
                <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                  Carga Inteligente
                </span>
              </h3>
              <p className="text-xs text-slate-400 m-0">
                Seleccione un esquema arquitectónico prediseñado para cargar muros, rutas e íconos automáticamente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border-none bg-transparent"
          >
            <X size={20} />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLAN_TEMPLATES.map(tmpl => (
            <div
              key={tmpl.id}
              onClick={() => handleSelect(tmpl)}
              className="p-5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl cursor-pointer transition-all space-y-3 group shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 group-hover:scale-105 transition-transform">
                    {tmpl.icon}
                  </div>
                  <span className="text-[10px] uppercase font-black bg-slate-900 text-slate-400 px-2.5 py-1 rounded-full border border-slate-800">
                    {tmpl.elements.length} Elementos
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-black text-white m-0 group-hover:text-amber-400 transition-colors">
                    {tmpl.name}
                  </h4>
                  <span className="text-xs font-bold text-amber-500/90 block mt-0.5">
                    {tmpl.sector}
                  </span>
                </div>

                <p className="text-xs text-slate-400 m-0 leading-relaxed font-medium">
                  {tmpl.description}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <span className="text-xs font-extrabold text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Cargar en Lienzo →
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            💡 Podrás modificar, mover o añadir más íconos libremente en el lienzo.
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer border-none"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskMapTemplateSelectorModal;
