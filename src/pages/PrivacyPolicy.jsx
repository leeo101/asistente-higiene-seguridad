import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div className="container" style={{ paddingTop: '6rem', paddingBottom: '5rem', maxWidth: '800px' }}>
            <button
                onClick={() => navigate(-1)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    marginBottom: '2rem'
                }}
            >
                <ArrowLeft size={18} /> Volver
            </button>

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
                <p style={{ color: 'var(--color-text-muted)' }}>Última actualización: 1 de marzo, 2026</p>
            </div>

            <div className="card" style={{ padding: '2.5rem', lineHeight: '1.7', color: 'var(--color-text)' }}>
                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '1.25rem', marginBottom: '1rem' }}>
                        <Eye size={20} color="var(--color-primary)" /> 1. Introducción
                    </h2>
                    <p>
                        En <strong>Asistente de Higiene y Seguridad</strong>, valoramos tu privacidad. Esta política describe cómo recopilamos y protegemos tu información cuando utilizas nuestra aplicación web y móvil.
                    </p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '1.25rem', marginBottom: '1rem' }}>
                        <FileText size={20} color="var(--color-primary)" /> 2. Información que Recopilamos
                    </h2>
                    <ul>
                        <li><strong>Datos de Cuenta:</strong> Correo electrónico y nombre (si te registras vía Firebase Auth).</li>
                        <li><strong>Datos de Informes:</strong> Los datos cargados en formularios (Carga de Fuego, Iluminación, ATS) se guardan localmente en tu dispositivo y se sincronizan de forma cifrada si tienes una cuenta activa.</li>
                        <li><strong>Cámara e Imágenes:</strong> Nuestra función de IA procesa imágenes en tiempo real para detectar EPP. **No almacenamos fotos en nuestros servidores** a menos que decidas guardarlas explícitamente en un reporte.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '1.25rem', marginBottom: '1rem' }}>
                        <Lock size={20} color="var(--color-primary)" /> 3. Seguridad de los Datos
                    </h2>
                    <p>
                        Implementamos medidas de seguridad estándar de la industria, incluyendo cifrado SSL/TLS y autenticación segura para garantizar que tu información profesional esté protegida contra accesos no autorizados.
                    </p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '1.25rem', marginBottom: '1rem' }}>
                        <ShieldCheck size={20} color="var(--color-primary)" /> 4. Uso de la Información
                    </h2>
                    <p>
                        Utilizamos tus datos exclusivamente para:
                    </p>
                    <ul>
                        <li>Generar los reportes técnicos en formato PDF.</li>
                        <li>Proveer asesoría legal técnica mediante Inteligencia Artificial.</li>
                        <li>Gestionar tu suscripción Premium.</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>5. Contacto</h2>
                    <p>
                        Si tienes dudas sobre tus datos, puedes contactarnos a través de la sección de Soporte en la aplicación o enviando un correo a nuestro equipo técnico.
                    </p>
                </section>
            </div>

            <div style={{ textAlign: 'center', marginTop: '3rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                &copy; 2026 Asistente H&S - Gestión Profesional
            </div>
        </div>
    );
}
