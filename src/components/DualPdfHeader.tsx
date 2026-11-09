import React from 'react';
import { Building2, CheckCircle2 } from 'lucide-react';

export interface DualPdfHeaderProps {
  title: string;
  subtitle?: string;
  normBadge?: string;
  normBadgeColor?: 'amber' | 'blue' | 'emerald' | 'purple' | 'red' | 'slate';
  normBadgeIcon?: React.ReactNode;
  documentId?: string;
  establishmentName?: string;
  establishmentCuit?: string;
  establishmentAddress?: string;
  consultantName?: string;
  consultantLicense?: string;
  consultantLogoUrl?: string | null;
  clientLogoUrl?: string | null;
  showConsultantLogo?: boolean;
  showClientLogo?: boolean;
  date?: string;
  className?: string;
}

const BADGE_COLORS = {
  amber: 'bg-amber-100 text-amber-900 border-amber-300',
  blue: 'bg-blue-100 text-blue-900 border-blue-300',
  emerald: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  purple: 'bg-purple-100 text-purple-900 border-purple-300',
  red: 'bg-red-100 text-red-900 border-red-300',
  slate: 'bg-slate-100 text-slate-800 border-slate-300'
};

function sanitizeLogoSrc(raw?: string | null): string | null {
  if (!raw || raw === 'null' || raw === 'undefined') return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('"data:') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        const candidate = parsed.value || parsed.logo;
        if (typeof candidate === 'string' && candidate.startsWith('data:image/')) {
          return candidate;
        }
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

/**
 * DualPdfHeader – Encabezado institucional para PDFs técnicos.
 * - Izquierda: Logo de la página (/logo.png) o logo personalizado de consultora.
 * - Centro: Título oficial, resolución/decreto y normativa aplicable.
 * - Derecha: Empresa / Establecimiento auditado (con logo propio o datos fiscales).
 */
export default function DualPdfHeader({
  title,
  subtitle,
  normBadge,
  normBadgeColor = 'blue',
  normBadgeIcon,
  documentId,
  establishmentName,
  establishmentCuit,
  establishmentAddress,
  consultantLogoUrl,
  clientLogoUrl,
  showConsultantLogo = true,
  showClientLogo = true,
  date,
  className = ''
}: DualPdfHeaderProps): React.ReactElement {
  const baseUrl =
    typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';

  let finalConsultantLogo = sanitizeLogoSrc(consultantLogoUrl);
  let finalClientLogo = sanitizeLogoSrc(clientLogoUrl);

  if (typeof window !== 'undefined') {
    if (!finalConsultantLogo) {
      try {
        finalConsultantLogo = sanitizeLogoSrc(localStorage.getItem('companyLogo'));
      } catch {
        /* ignore */
      }
    }
    if (!finalClientLogo) {
      try {
        const activeId = localStorage.getItem('hys_active_company_id');
        const companiesRaw = localStorage.getItem('hys_companies_list');
        if (activeId && companiesRaw) {
          const list = JSON.parse(companiesRaw);
          const current = list.find((c: any) => c.id === activeId);
          if (current?.logo) finalClientLogo = sanitizeLogoSrc(current.logo);
          if (!establishmentName && current?.name) establishmentName = current.name;
          if (!establishmentCuit && current?.cuit) establishmentCuit = current.cuit;
        }
      } catch {
        /* ignore */
      }
    }
  }

  const pageLogoSrc = finalConsultantLogo || `${baseUrl}/logo.png?v=3`;
  const badgeClass = BADGE_COLORS[normBadgeColor] || BADGE_COLORS.blue;

  return (
    <div
      className={`dual-pdf-header border-b-2 border-slate-800 pb-3 mb-4 avoid-break ${className}`}
      style={{ breakInside: 'avoid', pageBreakInside: 'avoid', display: 'block' }}
    >
      <div className="flex items-center justify-between gap-3">
        {/* LADO IZQUIERDO: Logo de la Página (HYS) o Logo de Consultora */}
        <div className="flex items-center gap-2.5 max-w-[28%] min-w-[120px]">
          {showConsultantLogo ? (
            <img
              src={pageLogoSrc}
              alt="Logo HYS"
              className="object-contain max-h-[46px] max-w-[130px]"
              style={{ maxHeight: '46px', maxWidth: '130px', objectFit: 'contain' }}
            />
          ) : null}
        </div>

        {/* CENTRO: Título del Documento, Resolución y Normativa */}
        <div className="flex-1 text-center px-2">
          {normBadge && (
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[7.5pt] font-black tracking-wider uppercase mb-1 shadow-sm ${badgeClass}`}
            >
              {normBadgeIcon || <CheckCircle2 size={11} />}
              <span>{normBadge}</span>
            </div>
          )}
          <h1 className="m-0 text-[1.15rem] sm:text-[1.25rem] font-black tracking-tight text-slate-900 leading-tight uppercase">
            {title}
          </h1>
          {subtitle && (
            <p className="m-0 text-[7.5pt] text-slate-600 font-semibold mt-0.5 leading-tight">{subtitle}</p>
          )}
        </div>

        {/* LADO DERECHO: Logo de la Empresa Cliente o Membrete Fiscal */}
        <div className="flex flex-col items-end text-right max-w-[28%] min-w-[120px]">
          {showClientLogo && finalClientLogo ? (
            <img
              src={finalClientLogo}
              alt="Logo Cliente"
              className="object-contain max-h-[46px] max-w-[130px]"
              style={{ maxHeight: '46px', maxWidth: '130px', objectFit: 'contain' }}
            />
          ) : establishmentName ? (
            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-right w-full">
              <span className="block text-[7.5pt] font-black uppercase text-slate-800 truncate">
                {establishmentName}
              </span>
              {establishmentCuit && (
                <span className="block text-[6.5pt] font-mono font-semibold text-slate-600">
                  CUIT: {establishmentCuit}
                </span>
              )}
              {establishmentAddress && (
                <span className="block text-[6pt] text-slate-500 truncate">{establishmentAddress}</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Building2 size={20} />
              <span className="text-[7pt] font-semibold">Establecimiento</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-1">
            {documentId && (
              <span className="text-[6.5pt] font-mono font-bold text-slate-500">
                DOC: {documentId.slice(0, 10)}
              </span>
            )}
            {date && <span className="text-[6.5pt] font-semibold text-slate-500">{date}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
