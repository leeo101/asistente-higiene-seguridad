import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, FileText, Download, Search,
    ExternalLink, BookOpen, Shield, Gavel
} from 'lucide-react';

export default function Legislation() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const docs = [
        {
            id: 'ley-19587',
            title: 'Ley 19.587',
            subtitle: 'Higiene y Seguridad en el Trabajo',
            description: 'Ley fundamental que establece las normas de seguridad y salud para todos los establecimientos y explotaciones.',
            category: 'Leyes',
            url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/15000-19999/17612/norma.htm'
        },
        {
            id: 'dto-351-79',
            title: 'Decreto 351/79',
            subtitle: 'Reglamentación General Ley 19.587',
            description: 'Reglamentación general para establecimientos industriales y comerciales. Especificaciones técnicas de protección.',
            category: 'Decretos',
            url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/30000-34999/32030/texact.htm'
        },
        {
            id: 'dto-911-96',
            title: 'Decreto 911/96',
            subtitle: 'Higiene y Seguridad en la Construcción',
            description: 'Normas específicas para la industria de la construcción, excavaciones, andamios y trabajos en altura.',
            category: 'Decretos',
            url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/35000-39999/37402/norma.htm'
        },
        {
            id: 'ley-24557',
            title: 'Ley 24.557',
            subtitle: 'Ley de Riesgos del Trabajo (LRT)',
            description: 'Establece el sistema de prevención de riesgos y reparación de daños derivados del trabajo.',
            category: 'Leyes',
            url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/25000-29999/27956/texact.htm'
        },
        {
            id: 'dto-617-97',
            title: 'Decreto 617/97',
            subtitle: 'Higiene y Seguridad en el Agro',
            description: 'Normativa específica para la actividad agraria y el uso de maquinaria rural.',
            category: 'Decretos',
            url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/40000-44999/44613/norma.htm'
        },
        {
            id: 'ley-27348',
            title: 'Ley 27.348',
            subtitle: 'Complementaria de LRT',
            description: 'Ley que establece el sistema de Comisiones Médicas y procedimientos administrativos.',
            category: 'Leyes',
            url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/270000-274999/271810/norma.htm'
        }
    ];

    const filteredDocs = docs.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container" style={{ paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', marginTop: '1rem' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text)' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Leyes y Normas</h1>
            </div>

            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                    type="text"
                    placeholder="Buscar ley, decreto o palabra clave..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '3rem', margin: 0 }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredDocs.map(doc => (
                    <div key={doc.id} className="card" style={{ padding: '1.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                            <div>
                                <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '50px',
                                    background: doc.category === 'Leyes' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    color: doc.category === 'Leyes' ? 'var(--color-primary)' : '#10b981',
                                    marginBottom: '0.5rem',
                                    display: 'inline-block'
                                }}>
                                    {doc.category}
                                </span>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{doc.title}</h3>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 600 }}>{doc.subtitle}</p>
                            </div>
                            <div style={{ background: 'var(--color-background)', padding: '0.6rem', borderRadius: '10px' }}>
                                <FileText size={24} color="var(--color-text-muted)" />
                            </div>
                        </div>

                        <p style={{ margin: '0 0 1.2rem 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                            {doc.description}
                        </p>

                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                            <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    flex: 1,
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.7rem',
                                    background: 'var(--color-primary)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700
                                }}
                            >
                                <ExternalLink size={16} /> Ver Online
                            </a>
                            <button
                                onClick={() => window.open(doc.url, '_blank')}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.7rem 1rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    color: 'var(--color-text)'
                                }}
                            >
                                <Download size={16} /> PDF
                            </button>
                        </div>
                    </div>
                ))}

                {filteredDocs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                        <Search size={48} style={{ marginBottom: '1rem' }} />
                        <p>No se encontraron documentos para "{searchTerm}"</p>
                    </div>
                )}
            </div>

            <div className="card" style={{ marginTop: '2rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))', border: '1px dashed rgba(139, 92, 246, 0.3)' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <BookOpen size={24} color="#8b5cf6" />
                    <div>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>Biblioteca Completa</h4>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Accede al portal oficial de InfoLeg para más normativas.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
