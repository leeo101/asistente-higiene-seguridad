import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck } from 'lucide-react';

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
  notes?: string;
}

interface MeasurementTrendChartProps {
  title: string;
  subtitle?: string;
  unit: string;
  data: TrendDataPoint[];
  legalLimit?: number;
  limitLabel?: string;
  limitType?: 'max' | 'min'; // 'max' para Ruido/PAT (no superar), 'min' para Iluminación (no estar por debajo)
}

export default function MeasurementTrendChart({
  title,
  subtitle,
  unit,
  data,
  legalLimit,
  limitLabel,
  limitType = 'max'
}: MeasurementTrendChartProps): React.ReactElement | null {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  const stats = useMemo(() => {
    if (sortedData.length === 0) return null;
    const first = sortedData[0].value;
    const last = sortedData[sortedData.length - 1].value;
    const diff = last - first;
    const pct = first !== 0 ? Math.round((diff / first) * 100) : 0;

    const isCurrentCompliant =
      legalLimit !== undefined
        ? limitType === 'max'
          ? last <= legalLimit
          : last >= legalLimit
        : true;

    return {
      first,
      last,
      diff: Math.round(diff * 10) / 10,
      pct,
      isCurrentCompliant
    };
  }, [sortedData, legalLimit, limitType]);

  if (sortedData.length === 0) {
    return (
      <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 text-center text-slate-400 text-sm">
        No hay suficientes mediciones históricas registradas para graficar la tendencia.
      </div>
    );
  }

  return (
    <div className="p-5 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl space-y-4">
      {/* Encabezado y Métricas de Resumen */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-black uppercase tracking-wider text-slate-100 flex items-center gap-2 m-0">
            {title}
          </h4>
          {subtitle && <p className="text-xs text-slate-400 m-0 mt-0.5">{subtitle}</p>}
        </div>

        {stats && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Último Valor</span>
              <span className="text-lg font-black text-amber-400">
                {stats.last} <span className="text-xs font-semibold text-slate-300">{unit}</span>
              </span>
            </div>

            <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              stats.isCurrentCompliant
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {stats.isCurrentCompliant ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
              <span>{stats.isCurrentCompliant ? 'Conforme' : 'Excede Límite'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Gráfico Recharts */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sortedData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={11}
              tickFormatter={(val) => {
                try {
                  const d = new Date(val);
                  return d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
                } catch {
                  return val;
                }
              }}
            />
            <YAxis stroke="#94a3b8" fontSize={11} unit={` ${unit}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#fff'
              }}
              formatter={(val: any) => [`${val} ${unit}`, 'Valor Medido']}
              labelFormatter={(lbl) => `Fecha: ${lbl}`}
            />

            {/* Línea de Límite Legal */}
            {legalLimit !== undefined && (
              <ReferenceLine
                y={legalLimit}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: limitLabel || `Límite (${legalLimit} ${unit})`,
                  position: 'insideTopRight',
                  fill: '#ef4444',
                  fontSize: 10,
                  fontWeight: 'bold'
                }}
              />
            )}

            {/* Curva de mediciones */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 1.5 }}
              activeDot={{ r: 7, fill: '#fbbf24' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Diagnóstico de Evolución */}
      {stats && (
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            {stats.diff > 0 ? (
              <TrendingUp size={16} className={limitType === 'max' ? 'text-red-400' : 'text-emerald-400'} />
            ) : stats.diff < 0 ? (
              <TrendingDown size={16} className={limitType === 'max' ? 'text-emerald-400' : 'text-red-400'} />
            ) : (
              <Minus size={16} className="text-slate-400" />
            )}
            <span>
              Variación global: <strong>{stats.diff > 0 ? `+${stats.diff}` : stats.diff} {unit} ({stats.pct > 0 ? `+${stats.pct}%` : `${stats.pct}%`})</strong> desde el primer relevamiento.
            </span>
          </div>

          <span className="text-[11px] text-slate-400 italic">
            {sortedData.length} mediciones comparadas
          </span>
        </div>
      )}
    </div>
  );
}
