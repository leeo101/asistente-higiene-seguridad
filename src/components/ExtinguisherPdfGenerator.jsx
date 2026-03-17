import React, { useRef } from 'react';
import { ArrowLeft, Printer, Flame, MapPin, Calendar, Building, CheckCircle2 } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useNavigate } from 'react-router-dom';

// Copy calculation utils here for the report
const addMonths = (dateString, months) => {
    const d = new Date(dateString + 'T12:00:00Z');
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
};

const getStatus = (lastDate, monthsValid) => {
    if (!lastDate) return { text: 'Sin Dato', color: '#000000', vto: '-' };
    const dueDate = addMonths(lastDate, monthsValid);
    const today = new Date().toISOString().split('T')[0];
    const diffDays = Math.ceil((new Date(dueDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Vencido', color: '#dc2626', vto: new Date(dueDate).toLocaleDateString() };
    if (diffDays <= 30) return { text: 'Próximo', color: '#d97706', vto: new Date(dueDate).toLocaleDateString() };
    return { text: 'Vigente', color: '#166534', vto: new Date(dueDate).toLocaleDateString() };
};

export default function ExtinguisherPdfGenerator({ extinguishers = [] }) {


    const componentRef = useRef();
    const isLandscape = extinguishers.length > 15; // Auto rotate if many

    const stats = {
        total: extinguishers.length,
        vencidos: extinguishers.filter(e => getStatus(e.ultimaCarga, 12).text === 'Vencido' || getStatus(e.ultimaPH, 60).text === 'Vencido').length
    };

    return (
        <div className="container" style={{ paddingBottom: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
                <div
                    id="pdf-content"
                    className="pdf-container card print-area"
                    ref={componentRef}
                    style={{
                        width: isLandscape ? '297mm' : '210mm',
                        minHeight: isLandscape ? '210mm' : '297mm',
                        padding: '15mm', background: '#ffffff', color: '#000000',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
                        boxSizing: 'border-box'
                    }}
                >
                    <style type="text/css" media="print">
                        {`
                            @page { size: A4 ${isLandscape ? 'landscape' : 'portrait'}; margin: 15mm; }
                            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                            .no-print { display: none !important; }
                            .print-area { 
                                box-shadow: none !important; 
                                margin: 0 !important; 
                                padding: 10mm !important; 
                                width: 100% !important; 
                                max-width: none !important; 
                                border: 1px solid #1e293b !important;
                                border-radius: 0 !important; 
                            }
                            .company-logo {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                color-adjust: exact !important;
                            }
                        `}
                    </style>

                    {/* Header */}
                    <div style={{ borderBottom: '3px solid #1e293b', paddingBottom: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h1 style={{ margin: '0 0 5px 0', fontSize: '18pt', color: '#1e293b', fontWeight: 900, textTransform: 'uppercase' }}>
                                Planilla de Control de Extintores
                            </h1>
                            <p style={{ margin: 0, fontSize: '10pt', color: '#475569', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span><Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Fecha: {new Date().toLocaleDateString()}</span>
                                <span><Flame size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Equipos: {stats.total}</span>
                                {stats.vencidos > 0 && <span style={{ color: '#dc2626', fontWeight: 'bold' }}>({stats.vencidos} Vencidos)</span>}
                            </p>
                        </div>
                        <CompanyLogo
                            style={{
                                height: '45px',
                                width: 'auto',
                                objectFit: 'contain',
                                maxWidth: '140px'
                            }}
                        />
                    </div>

                    {/* Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', fontFamily: 'sans-serif' }}>
                        <thead>
                            <tr style={{ background: '#f1f5f9' }}>
                                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', width: '8%', fontWeight: 800 }}>Chapa</th>
                                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left', width: '25%', fontWeight: 800 }}>Ubicación</th>
                                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left', width: '20%', fontWeight: 800 }}>Tipo y Capacidad</th>
                                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', width: '22%', fontWeight: 800 }}>Estado Carga</th>
                                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', width: '25%', fontWeight: 800 }}>Estado PH</th>
                            </tr>
                        </thead>
                        <tbody>
                            {extinguishers?.map((ext, idx) => {
                                const sCarga = getStatus(ext?.ultimaCarga, 12);
                                const sPH = getStatus(ext?.ultimaPH, 60);

                                return (
                                    <tr key={idx} style={{ pageBreakInside: 'avoid' }}>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{ext?.chapa || '-'}</td>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>
                                            {ext?.ubicacion || 'Sin ubicación'}
                                            {ext?.empresa && <div style={{ fontSize: '7.5pt', color: '#64748b' }}>{ext.empresa}</div>}
                                        </td>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>
                                            {ext?.tipo || 'N/A'} <br />
                                            <span style={{ fontSize: '8pt', color: '#475569' }}>{ext?.capacidad || '-'}</span>
                                        </td>

                                        <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>
                                            <div style={{ color: sCarga.color, fontWeight: 'bold' }}>{sCarga.text}</div>
                                            <div style={{ fontSize: '8pt' }}>Vto: {sCarga.vto}</div>
                                        </td>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>
                                            <div style={{ color: sPH.color, fontWeight: 'bold' }}>{sPH.text}</div>
                                            <div style={{ fontSize: '8pt' }}>Vto: {sPH.vto}</div>
                                        </td>
                                    </tr>
                                )
                            })}

                            {extinguishers.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                                        No hay extintores registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Signatures Area */}
                    <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'flex-start', pageBreakInside: 'avoid' }}>
                        <div style={{ width: '250px', textAlign: 'center' }}>
                            <div style={{ borderBottom: '1px solid #64748b', height: '40px', marginBottom: '5px' }}></div>
                            <div style={{ fontSize: '8pt', color: '#64748b' }}>Firma y Sello Responsable H&S</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
