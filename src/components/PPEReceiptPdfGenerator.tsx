import React from 'react';
import CompanyLogo from './CompanyLogo';

export default function PPEReceiptPdfGenerator(): React.ReactElement | null {
    // Plantilla estándar de Resolución 299/11 SRT (Argentina)
    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="ppe-receipt-pdf"
                className="pdf-container print-area"
                style={{
                    width: '100%', maxWidth: '210mm', minHeight: '297mm',
                    padding: '10mm 15mm', background: '#ffffff', color: '#000000',
                    boxSizing: 'border-box', margin: '0 auto', fontSize: '9pt',
                    fontFamily: 'Arial, Helvetica, sans-serif'
                }}
            >
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .no-print { display: none !important; }
                        .print-area { box-shadow: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: none !important; border: none !important; border-radius: 0 !important; min-height: auto !important; height: auto !important; }
                        td, th { padding: 4px; border: 1px solid #000; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                    `}
                </style>

                {/* Header Res 299/11 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ width: '150px' }}>
                        <CompanyLogo style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '11pt', fontWeight: 'bold' }}>CONSTANCIA DE ENTREGA DE ROPA DE TRABAJO Y</h2>
                        <h2 style={{ margin: 0, fontSize: '11pt', fontWeight: 'bold' }}>ELEMENTOS DE PROTECCIÓN PERSONAL</h2>
                        <p style={{ margin: '5px 0 0 0', fontSize: '8pt' }}>Resolución S.R.T. N° 299/11</p>
                    </div>
                    <div style={{ width: '150px', textAlign: 'right', fontSize: '8pt' }}>
                        Hoja N°: 1 / 1
                    </div>
                </div>

                {/* Datos del Empleador y Trabajador */}
                <table>
                    <tbody>
                        <tr>
                            <td colSpan={2} style={{ background: '#f0f0f0', fontWeight: 'bold', textAlign: 'center', fontSize: '8pt' }}>DATOS DEL EMPLEADOR</td>
                        </tr>
                        <tr>
                            <td style={{ width: '50%' }}>Razón Social:</td>
                            <td style={{ width: '50%' }}>C.U.I.T. N°:</td>
                        </tr>
                        <tr>
                            <td>Dirección:</td>
                            <td>Localidad / Provincia:</td>
                        </tr>
                    </tbody>
                </table>

                <table>
                    <tbody>
                        <tr>
                            <td colSpan={3} style={{ background: '#f0f0f0', fontWeight: 'bold', textAlign: 'center', fontSize: '8pt' }}>DATOS DEL TRABAJADOR</td>
                        </tr>
                        <tr>
                            <td colSpan={2} style={{ width: '66%' }}>Apellido y Nombre:</td>
                            <td style={{ width: '34%' }}>D.N.I. N°:</td>
                        </tr>
                        <tr>
                            <td colSpan={3}>Puesto de Trabajo:</td>
                        </tr>
                    </tbody>
                </table>

                <p style={{ fontSize: '8pt', textAlign: 'justify', marginBottom: '10px', lineHeight: 1.3 }}>
                    Con la firma del presente documento el trabajador declara conocer los riesgos a los que está expuesto en su puesto de trabajo, y haber recibido información y capacitación respecto del uso adecuado, conservación, mantenimiento y cuidado de los elementos de protección personal provistos. El trabajador se compromete a utilizarlos durante la jornada laboral y a solicitar su reemplazo cuando los mismos se encuentren deteriorados o hayan perdido su capacidad de protección.
                </p>

                {/* Tabla de EPPs */}
                <table>
                    <thead>
                        <tr style={{ background: '#f0f0f0', fontSize: '7pt', textAlign: 'center' }}>
                            <th style={{ width: '20%' }}>PRODUCTO / EPP</th>
                            <th style={{ width: '10%' }}>TIPO / MODELO</th>
                            <th style={{ width: '15%' }}>MARCA</th>
                            <th style={{ width: '15%' }}>CERTIFICACIÓN (Sello)</th>
                            <th style={{ width: '10%' }}>CANT.</th>
                            <th style={{ width: '15%' }}>FECHA ENTREGA</th>
                            <th style={{ width: '15%' }}>FIRMA TRABAJADOR</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(15)].map((_, i) => (
                            <tr key={i} style={{ height: '25px' }}>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Firmas finales */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
                    <div style={{ width: '45%', textAlign: 'center' }}>
                        <div style={{ borderBottom: '1px solid #000', height: '40px', marginBottom: '5px' }}></div>
                        <span style={{ fontSize: '8pt' }}>Firma del Trabajador</span>
                    </div>
                    <div style={{ width: '45%', textAlign: 'center' }}>
                        <div style={{ borderBottom: '1px solid #000', height: '40px', marginBottom: '5px' }}></div>
                        <span style={{ fontSize: '8pt' }}>Firma Responsable Higiene y Seguridad / Empleador</span>
                    </div>
                </div>
                
                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '7pt', color: '#666' }}>
                    Formulario generado mediante Asistente HYS - Modelo conforme Anexo I Resolución SRT 299/11
                </div>
            </div>
        </div>
    );
}
