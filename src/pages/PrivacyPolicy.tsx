import { useNavigate } from 'react-router-dom';
import React from 'react';

import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Database, UserCheck, RefreshCw, Mail } from 'lucide-react';

export default function PrivacyPolicy(): React.ReactElement | null {
    const navigate = useNavigate();

    return (
        <div className="container" style={{ paddingTop: '6rem', paddingBottom: '5rem', maxWidth: '800px' }}>
            <></>

            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: 'var(--color-primary)',
                    borderRadius: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem'
                }}>
                    <ShieldCheck size={32} />
                </div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>Política de Privacidad</h1>
                <p style={{ color: 'var(--color-text-muted)' }}>Última actualización: 26 de mayo, 2026</p>
            </div>

            <div className="card" style={{ padding: '2.5rem', lineHeight: '1.7', color: 'var(--color-text)' }}>
                <section style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
                        <Eye size={20} color="var(--color-primary)" /> 1. Introducción
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        En <strong>Asistente de Higiene y Seguridad</strong>, el respeto y la protección de tus datos son nuestra prioridad. Esta Política de Privacidad describe de manera transparente cómo recopilamos, utilizamos, almacenamos y protegemos la información personal y profesional cuando utilizas nuestra plataforma web y móvil. Al utilizar nuestros servicios, aceptas las prácticas descritas en este documento.
                    </p>
                </section>

                <section style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
                        <Database size={20} color="var(--color-primary)" /> 2. Información que Recopilamos
                    </h2>
                    <ul style={{ color: 'var(--color-text-muted)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li><strong>Datos de Cuenta y Perfil:</strong> Recopilamos tu correo electrónico, nombre y profesión cuando te registras mediante Firebase Authentication para identificarte unívocamente y personalizar tus reportes.</li>
                        <li><strong>Datos Operativos y Técnicos:</strong> Toda la información cargada en nuestros módulos (como ATS, Carga de Fuego, Auditorías, etc.) es procesada localmente. Si posees una cuenta activa y conexión, esta información se sincroniza de forma segura en la nube para garantizar el respaldo y la disponibilidad de tu trabajo.</li>
                        <li><strong>Procesamiento de Imágenes e IA:</strong> Nuestro módulo de Cámara IA procesa el flujo de video en tiempo real, de manera puramente local en el dispositivo del usuario, para la detección de Elementos de Protección Personal (EPP). <strong>No grabamos, transmitimos ni almacenamos secuencias de video o fotografías en nuestros servidores</strong>, salvo que el usuario decida explícitamente guardar una captura como evidencia en un reporte auditable.</li>
                        <li><strong>Datos de Uso:</strong> Podemos recopilar métricas anónimas sobre cómo interactúas con la aplicación (por ejemplo, módulos más utilizados) para mejorar continuamente el rendimiento y la experiencia de usuario.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
                        <Lock size={20} color="var(--color-primary)" /> 3. Seguridad y Almacenamiento de Datos
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Implementamos estrictas medidas de seguridad técnicas y organizativas para proteger tu información profesional contra accesos no autorizados, alteraciones, divulgaciones o destrucción. Toda transmisión de datos entre tu dispositivo y nuestros servidores se realiza a través de protocolos de cifrado robustos (SSL/TLS). Los repositorios de datos en la nube están protegidos mediante reglas de seguridad arquitectónicas en Firebase.
                    </p>
                </section>

                <section style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
                        <ShieldCheck size={20} color="var(--color-primary)" /> 4. Uso de la Información
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                        Tus datos se utilizan de forma exclusiva para los siguientes fines operativos:
                    </p>
                    <ul style={{ color: 'var(--color-text-muted)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li>Generar los reportes técnicos en formato PDF con la firma y el aval del profesional interviniente.</li>
                        <li>Proveer asesoría técnica, legal y recomendaciones mediante Inteligencia Artificial basándose en los parámetros provistos por el usuario.</li>
                        <li>Gestionar el estado de tu suscripción Premium y facilitar la recuperación de la cuenta.</li>
                        <li>Cumplir con requerimientos legales o regulatorios que pudieran aplicar.</li>
                    </ul>
                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: 'var(--color-text)' }}>
                        <strong>Compromiso fundamental:</strong> Bajo ninguna circunstancia vendemos, alquilamos ni comercializamos tu información personal ni los datos de las empresas auditadas a terceros, agencias de publicidad o intermediarios de datos.
                    </div>
                </section>

                <section style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
                        <UserCheck size={20} color="var(--color-primary)" /> 5. Tus Derechos y Control de Datos
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Como usuario, eres el dueño absoluto de tu información. Tienes el derecho de acceder, rectificar, exportar y eliminar de forma definitiva los datos almacenados en nuestra plataforma en cualquier momento, solicitándolo desde las configuraciones de tu cuenta o comunicándote con nuestro equipo de soporte técnico. Al eliminar una cuenta, se borran irreversiblemente todos los reportes asociados en la nube.
                    </p>
                </section>

                <section style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
                        <RefreshCw size={20} color="var(--color-primary)" /> 6. Cambios en esta Política
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Nos reservamos el derecho a modificar esta Política de Privacidad en cualquier momento para reflejar actualizaciones legales, operativas o tecnológicas. Cualquier cambio significativo será notificado a los usuarios registrados mediante un correo electrónico o un aviso destacado dentro de la aplicación.
                    </p>
                </section>

                <section>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
                        <Mail size={20} color="var(--color-primary)" /> 7. Contacto
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Si tienes dudas, consultas o requerimientos legales respecto a cómo procesamos tus datos, no dudes en contactarnos mediante la sección de Soporte de la aplicación o enviando un correo a nuestro equipo de legal y privacidad.
                    </p>
                </section>
            </div>

            <div style={{ textAlign: 'center', marginTop: '3rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                &copy; {new Date().getFullYear()} Asistente H&S - Gestión Profesional
            </div>
        </div>
    );
}
