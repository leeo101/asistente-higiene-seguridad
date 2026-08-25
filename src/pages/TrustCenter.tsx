import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  LockKey,
  Key,
  Users,
  Scroll,
  CheckCircle,
  FileCode,
  DownloadSimple,
  ShieldWarning,
  HardDrive,
  Database,
  Cpu,
  Clock,
  Trash
} from '@phosphor-icons/react';
import AnimatedPage from '../components/AnimatedPage';
import { getAuditLogs, clearAuditLogs, AuditLogEvent } from '../services/auditLogger';
import { toast } from 'react-hot-toast';

export default function TrustCenter() {
  const [activeTab, setActiveTab] = useState<'overview' | 'sso' | 'rbac' | 'audit'>('overview');
  const [logs, setLogs] = useState<AuditLogEvent[]>([]);

  useEffect(() => {
    setLogs(getAuditLogs());
  }, []);

  const handleClearLogs = () => {
    if (window.confirm('¿Desea limpiar el registro de auditoría local?')) {
      clearAuditLogs();
      setLogs([]);
      toast.success('Logs de auditoría reiniciados');
    }
  };

  const handleExportLogs = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ehs_audit_logs_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast.success('Registro de auditoría exportado en JSON');
  };

  return (
    <AnimatedPage>
      <div className="max-w-6xl mx-auto px-4 py-8 text-slate-100 space-y-8">
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 md:p-8 rounded-2xl border border-blue-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-blue-400/30">
                <ShieldCheck size={16} className="text-blue-400" />
                Enterprise Security & Trust Suite
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Centro de Seguridad & Confianza Corporativa
              </h1>
              <p className="text-slate-300 mt-2 max-w-2xl text-sm md:text-base leading-relaxed">
                Estándares internacionales de protección de datos, encriptación AES-256, Single Sign-On (SSO SAML 2.0/Azure AD) y trazabilidad inalterable de auditorías EHS.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                <CheckCircle size={16} /> ISO 27001 Ready
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs font-semibold">
                <LockKey size={16} /> TLS 1.3 / AES-256
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-8 border-b border-slate-700/60 pb-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'bg-blue-600/30 text-blue-300 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck size={16} /> Vista General
            </button>
            <button
              onClick={() => setActiveTab('sso')}
              className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
                activeTab === 'sso'
                  ? 'bg-blue-600/30 text-blue-300 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Key size={16} /> Enterprise SSO (SAML 2.0)
            </button>
            <button
              onClick={() => setActiveTab('rbac')}
              className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
                activeTab === 'rbac'
                  ? 'bg-blue-600/30 text-blue-300 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users size={16} /> Matriz de Permisos (RBAC)
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
                activeTab === 'audit'
                  ? 'bg-blue-600/30 text-blue-300 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scroll size={16} /> Registro de Auditoría ({logs.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="p-3 bg-blue-600/20 text-blue-400 w-fit rounded-xl">
                <LockKey size={24} />
              </div>
              <h3 className="font-bold text-lg text-white">Encriptación de Punto a Punto</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Toda la información transmitida utiliza túneles SSL/TLS 1.3 con cifrado de grado bancario AES-256 en reposo para bases de datos e imágenes adjuntas.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="p-3 bg-emerald-600/20 text-emerald-400 w-fit rounded-xl">
                <Database size={24} />
              </div>
              <h3 className="font-bold text-lg text-white">Aislamiento de Clientes (Multi-Tenant)</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Arquitectura multi-tenant con segregación lógica estricta por ID de Organización, previniendo acceso cruzado entre distintas corporaciones.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="p-3 bg-purple-600/20 text-purple-400 w-fit rounded-xl">
                <Clock size={24} />
              </div>
              <h3 className="font-bold text-lg text-white">Alta Disponibilidad & Backup 24/7</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Respaldo automatizado continuo con redundancia en múltiples regiones de nube y SLA garantizado del 99.9% para plantas industriales.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: SSO */}
        {activeTab === 'sso' && (
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-6">
            <div className="flex items-center gap-3">
              <Key size={28} className="text-amber-400" />
              <div>
                <h3 className="text-xl font-bold text-white">Configuración de Enterprise Single Sign-On (SSO)</h3>
                <p className="text-slate-400 text-xs">Integración directa con los proveedores de identidad corporativos.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <span className="font-semibold text-sm">Azure AD / Microsoft Entra ID</span>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded-md font-mono">Compatible</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <span className="font-semibold text-sm">Okta SAML 2.0</span>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded-md font-mono">Compatible</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <span className="font-semibold text-sm">Google Workspace OAuth2</span>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded-md font-mono">Activo</span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
              <div className="text-slate-500">// Ejemplo de Configuración SAML Metadata URL</div>
              <div>https://auth.higiene-seguridad.app/saml/v2/metadata?tenant_id=your_company_id</div>
            </div>
          </div>
        )}

        {/* Tab 3: RBAC */}
        {activeTab === 'rbac' && (
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Users size={24} className="text-blue-400" /> Matriz de Control de Acceso Basado en Roles (RBAC)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Módulo / Permiso</th>
                    <th className="p-3">SuperAdmin EHS</th>
                    <th className="p-3">Gerente de Planta</th>
                    <th className="p-3">Inspector de Campo</th>
                    <th className="p-3">Auditor Externo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="p-3 font-medium">Creación de ATS / JSA</td>
                    <td className="p-3 text-emerald-400">Lectura/Escritura</td>
                    <td className="p-3 text-emerald-400">Aprobación</td>
                    <td className="p-3 text-emerald-400">Lectura/Escritura</td>
                    <td className="p-3 text-slate-400">Sólo Lectura</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Permisos de Trabajo Críticos</td>
                    <td className="p-3 text-emerald-400">Lectura/Escritura</td>
                    <td className="p-3 text-emerald-400">Firma Autorizada</td>
                    <td className="p-3 text-emerald-400">Creación/Solicitud</td>
                    <td className="p-3 text-slate-400">Sólo Lectura</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Carga de Fuego & Extintores</td>
                    <td className="p-3 text-emerald-400">Total</td>
                    <td className="p-3 text-emerald-400">Total</td>
                    <td className="p-3 text-emerald-400">Escaneo/Control</td>
                    <td className="p-3 text-slate-400">Sólo Lectura</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Exportación de Logs & Auditoría</td>
                    <td className="p-3 text-emerald-400">Total</td>
                    <td className="p-3 text-emerald-400">Total</td>
                    <td className="p-3 text-rose-400">Restringido</td>
                    <td className="p-3 text-emerald-400">Exportación PDF</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Scroll size={24} className="text-emerald-400" /> Registro Inalterable de Auditoría (Audit Trail)
                </h3>
                <p className="text-slate-400 text-xs mt-1">Historial detallado de acciones realizadas en la plataforma.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportLogs}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <DownloadSimple size={16} /> Exportar JSON
                </button>
                <button
                  onClick={handleClearLogs}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Trash size={16} /> Limpiar
                </button>
              </div>
            </div>

            {logs.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400 text-sm">
                No hay registros de auditoría almacenados localmente en esta sesión.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96 custom-scrollbar">
                <table className="w-full text-left text-xs font-mono text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase">
                    <tr>
                      <th className="p-2.5">Fecha / Hora</th>
                      <th className="p-2.5">Acción</th>
                      <th className="p-2.5">Módulo</th>
                      <th className="p-2.5">Detalles</th>
                      <th className="p-2.5">Etiqueta EHS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="p-2.5 text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-2.5 font-bold text-blue-400">{log.action}</td>
                        <td className="p-2.5 text-emerald-400">{log.module}</td>
                        <td className="p-2.5 text-slate-200">{log.details}</td>
                        <td className="p-2.5 text-amber-400 text-[11px]">{log.complianceTag}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
