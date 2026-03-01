import React from 'react';
import { ArrowLeft, ShieldCheck, FileText, Server, Eye, Cloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', paddingBottom: '6rem' }}>
            <button
                onClick={() => navigate(-1)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    cursor: 'pointer',
                    marginBottom: '2rem',
                    padding: '0',
                    fontWeight: '600'
                }}
            >
                <ArrowLeft size={20} /> Volver
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
                <ShieldCheck size={40} />
                <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: '800', color: 'var(--color-text)' }}>Políticas de Privacidad</h1>
            </div>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', marginBottom: '2rem' }}>
                Última actualización: {new Date().toLocaleDateString('es-AR')}
            </p>

            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={24} /> 1. Información que Recopilamos
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
                        Para brindar una experiencia completa en <strong>Asistente de Higiene y Seguridad</strong>, recopilamos los siguientes datos al momento de registrarse y utilizar la plataforma:
                    </p>
                    <ul style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7', paddingLeft: '1.5rem' }}>
                        <li><strong>Datos de Identidad del Profesional:</strong> Nombre completo, correo electrónico, DNI, matrícula profesional y número de teléfono.</li>
                        <li><strong>Datos del Proyecto:</strong> Nombres de las empresas, ubicaciones, responsables y contenidos cargados manualmente en hojas de firma, reportes y checklists.</li>
                        <li><strong>Archivos Multimedia:</strong> Fotografías y capturas subidas para ser analizadas por Inteligencia Artificial y adjuntadas en la Matriz de Riesgo o Reportes Ergonómicos y Generales.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Server size={24} /> 2. Uso y Finalidad de los Datos
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
                        Toda la información ingresada tiene un propósito estricto, orientado al funcionamiento core de la herramienta profesional:
                    </p>
                    <ul style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7', paddingLeft: '1.5rem' }}>
                        <li>Generar Reportes en formato PDF listos para imprimir o compartir, autocompletando firmas e información del profesional.</li>
                        <li>Proporcionar historiales sincronizados de Análisis de Trabajo Seguro (ATS), Cálculos de Carga de Fuego y checkeos preventivos para su fácil auditoría médica y técnica.</li>
                        <li>Gestionar de forma segura la habilitación de cuenta, acceso Premium e identidad mediante autenticación oficial de Firebase (Google).</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Eye size={24} /> 3. Tratamiento de Inteligencia Artificial
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
                        Nuestra herramienta insignia de <strong>Cámara IA</strong> utiliza la API de Google Gemini para procesar las imágenes subidas a la plataforma.
                        Dichas imágenes son analizadas temporalmente en la nube de Google para detectar elementos de protección personal (EPP), riesgos eléctricos, desniveles, fuego, y maquinaria pesada, devolviendo un texto sugerido.
                        <br /><br />
                        <strong>Ninguna fotografía confidencial de su cliente es usada para entrenar nuestros modelos subyacentes ni almacenada públicamente</strong>. La eliminación del reporte en su Historial desencadena mecanismos para ocultar dichas imágenes de su panel.
                    </p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Cloud size={24} /> 4. Almacenamiento, Pagos y Terceros
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
                        Los pagos y suscripciones de nivel PRO son encriptados y gestionados enteramente por <strong>Mercado Pago</strong>. Asistente H&S no almacena, procesa, ni tiene acceso a tarjetas de crédito vinculadas.
                        <br /><br />
                        Sus bases de datos de reportes están fuertemente encriptadas en tránsito utilizando Firestore y Firebase Storage de Google, limitando el acceso arquitectónicamente solo al usuario propietario del registro (Reglas de Seguridad Zero-Trust).
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '1rem' }}>
                        5. Aceptación
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
                        Al marcar la casilla "Acepto las Políticas de Privacidad" durante la creación de su cuenta e ingresar a la aplicación, usted como Profesional certifica que ha leído y comprende la forma en la que sus datos y los relevamientos de sus clientes y empresas son tratados por Asistente H&S para facilitarle la generación en la nube de sus documentos.
                    </p>
                </section>
            </div>
        </div>
    );
}
