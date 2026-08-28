import { useNavigate } from 'react-router-dom';
import React from 'react';
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Database, UserCheck, RefreshCw, Mail } from 'lucide-react';

export default function PrivacyPolicy(): React.ReactElement | null {
  const navigate = useNavigate();

  return (
    <div className="container pt-[6rem] pb-[5rem] max-w-[800px]">
      <div className="text-center mb-[3rem]">
        <div className="w-[60px] h-[60px] bg-[rgba(59,_130,_246,_0.1)] text-[var(--color-primary)] rounded-[15px] flex items-center justify-center m-[0_auto_1rem]">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-[2.5rem] font-[900]">Política de Privacidad</h1>
        <p className="text-[var(--color-text-muted)]">Última actualización: {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric', day: 'numeric' })}</p>
      </div>

      <div className="card p-[2.5rem] line-height-[1.7] text-[var(--color-text)]">
        <section className="mb-[2.5rem]">
          <h2 className="flex items-center gap-[0.7rem] text-[1.25rem] mb-[1rem] text-[var(--color-text)]">
            <Eye size={20} color="var(--color-primary)" /> 1. Introducción
          </h2>
          <p className="text-[var(--color-text-muted)]">
            En <strong>Asistente de Higiene y Seguridad</strong>, el respeto y la protección de tus datos son nuestra prioridad. Esta Política de Privacidad describe de manera transparente cómo recopilamos, utilizamos, almacenamos y protegemos la información personal y profesional cuando utilizas nuestra plataforma web y móvil. Al utilizar nuestros servicios, aceptas las prácticas descritas en este documento.
          </p>
        </section>

        <section className="mb-[2.5rem]">
          <h2 className="flex items-center gap-[0.7rem] text-[1.25rem] mb-[1rem] text-[var(--color-text)]">
            <Database size={20} color="var(--color-primary)" /> 2. Información que Recopilamos
          </h2>
          <ul className="text-[var(--color-text-muted)] pl-[1.5rem] flex flex-col gap-[0.5rem]">
            <li><strong>Datos de Cuenta y Perfil:</strong> Recopilamos tu correo electrónico, nombre y profesión cuando te registras mediante Firebase Authentication para identificarte unívocamente y personalizar tus reportes.</li>
            <li><strong>Datos Operativos y Técnicos:</strong> Toda la información cargada en nuestros módulos (como ATS, Carga de Fuego, Auditorías, etc.) es procesada localmente. Si posees una cuenta activa y conexión, esta información se sincroniza de forma segura en la nube para garantizar el respaldo y la disponibilidad de tu trabajo.</li>
            <li><strong>Procesamiento de Imágenes e IA:</strong> Nuestro módulo de Cámara IA procesa el flujo de video en tiempo real de manera local para la detección de Elementos de Protección Personal (EPP). <strong>No grabamos ni almacenamos secuencias de video en servidores externos</strong>, salvo que el usuario guarde explícitamente una captura como evidencia en un reporte auditable.</li>
          </ul>
        </section>

        <section className="mb-[2.5rem]">
          <h2 className="flex items-center gap-[0.7rem] text-[1.25rem] mb-[1rem] text-[var(--color-text)]">
            <Lock size={20} color="var(--color-primary)" /> 3. Seguridad y Almacenamiento de Datos
          </h2>
          <p className="text-[var(--color-text-muted)]">
            Implementamos estrictas medidas de seguridad técnicas y organizativas para proteger tu información profesional contra accesos no autorizados, alteraciones o divulgaciones. Toda transmisión de datos se realiza a través de protocolos de cifrado robustos (SSL/TLS / AES-256).
          </p>
          
          {/* Banner con enlace directo a Centro de Seguridad & Trust Enterprise */}
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs font-bold text-blue-400 max-w-md">
              🛡️ Para conocer nuestros protocolos de cifrado AES-256, autenticación SSO y registros inalterables de auditoría:
            </div>
            <button
              onClick={() => navigate('/security-trust')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs cursor-pointer border-none shadow-md transition-all"
            >
              Ver Centro de Seguridad & Trust →
            </button>
          </div>
        </section>

        <section className="mb-[2.5rem]">
          <h2 className="flex items-center gap-[0.7rem] text-[1.25rem] mb-[1rem] text-[var(--color-text)]">
            <ShieldCheck size={20} color="var(--color-primary)" /> 4. Uso de la Información
          </h2>
          <p className="text-[var(--color-text-muted)] mb-[0.5rem]">
            Tus datos se utilizan de forma exclusiva para los siguientes fines operativos:
          </p>
          <ul className="text-[var(--color-text-muted)] pl-[1.5rem] flex flex-col gap-[0.5rem]">
            <li>Generar los reportes técnicos en formato PDF con la firma y el aval del profesional interviniente.</li>
            <li>Proveer asesoría técnica, legal y recomendaciones mediante Inteligencia Artificial basándose en los parámetros provistos por el usuario.</li>
            <li>Gestionar el estado de tu suscripción Premium y facilitar la recuperación de la cuenta.</li>
          </ul>
          <div className="mt-[1rem] p-[1rem] bg-[rgba(239,_68,_68,_0.1)] border-[1px_solid_rgba(239,_68,_68,_0.2)] rounded-[8px] text-[var(--color-text)] text-xs font-semibold">
            <strong>Compromiso fundamental:</strong> Bajo ninguna circunstancia vendemos, alquilamos ni comercializamos tu información personal ni los datos de las empresas auditadas a terceros.
          </div>
        </section>

        <section className="mb-[2.5rem]">
          <h2 className="flex items-center gap-[0.7rem] text-[1.25rem] mb-[1rem] text-[var(--color-text)]">
            <UserCheck size={20} color="var(--color-primary)" /> 5. Tus Derechos y Control de Datos
          </h2>
          <p className="text-[var(--color-text-muted)]">
            Como usuario, eres el dueño absoluto de tu información. Tienes el derecho de acceder, rectificar, exportar y eliminar de forma definitiva los datos almacenados en nuestra plataforma en cualquier momento.
          </p>
        </section>

        <section className="mb-[2.5rem]">
          <h2 className="flex items-center gap-[0.7rem] text-[1.25rem] mb-[1rem] text-[var(--color-text)]">
            <RefreshCw size={20} color="var(--color-primary)" /> 6. Cambios en esta Política
          </h2>
          <p className="text-[var(--color-text-muted)]">
            Nos reservamos el derecho a modificar esta Política de Privacidad en cualquier momento para reflejar actualizaciones legales, operativas o tecnológicas.
          </p>
        </section>

        <section>
          <h2 className="flex items-center gap-[0.7rem] text-[1.25rem] mb-[1rem] text-[var(--color-text)]">
            <Mail size={20} color="var(--color-primary)" /> 7. Contacto
          </h2>
          <p className="text-[var(--color-text-muted)]">
            Si tienes dudas o consultas sobre el tratamiento de tus datos, puedes contactarnos desde la sección de Soporte de la aplicación.
          </p>
        </section>
      </div>

      <div className="text-center mt-[3rem] text-[0.9rem] text-[var(--color-text-muted)]">
        &copy; {new Date().getFullYear()} Asistente H&S - Gestión Profesional
      </div>
    </div>
  );
}