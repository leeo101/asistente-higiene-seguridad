import React, { useState, useEffect } from 'react';
import CompanyLogo from './CompanyLogo';

export interface PPEReceiptData {
  razonSocial?: string;
  cuit?: string;
  direccion?: string;
  localidad?: string;
  trabajadorNombre?: string;
  trabajadorDni?: string;
  puestoTrabajo?: string;
}

interface PPEReceiptPdfGeneratorProps {
  items?: any[];
  receiptData?: PPEReceiptData;
}

export default function PPEReceiptPdfGenerator({ items = [], receiptData }: PPEReceiptPdfGeneratorProps): React.ReactElement | null {
  const [employerData, setEmployerData] = useState({
    razonSocial: '',
    cuit: '',
    direccion: '',
    localidad: ''
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('personalData');
      if (saved) {
        const pd = JSON.parse(saved);
        setEmployerData({
          razonSocial: pd.company || pd.name || '',
          cuit: pd.cuit || '',
          direccion: pd.address || '',
          localidad: pd.city || pd.province || ''
        });
      }
    } catch (e) {}
  }, []);

  const emp = {
    razonSocial: receiptData?.razonSocial || employerData.razonSocial || '-',
    cuit: receiptData?.cuit || employerData.cuit || '-',
    direccion: receiptData?.direccion || employerData.direccion || '-',
    localidad: receiptData?.localidad || employerData.localidad || '-'
  };

  const firstItem = items.length > 0 ? items[0] : null;
  const workerName = receiptData?.trabajadorNombre || firstItem?.responsible || '-';
  const workerDni = receiptData?.trabajadorDni || '-';
  const workerPosition = receiptData?.puestoTrabajo || '-';

  // Mostrar items asignados y rellenar hasta un total de 12 filas
  const totalRows = Math.max(items.length, 10);
  const rows = Array.from({ length: totalRows }).map((_, idx) => items[idx] || null);

  return (
    <div className="w-full print:m-0 print:p-0">
      <div
        id="ppe-receipt-pdf"
        className="pdf-container print-area w-full p-[10mm_15mm] bg-[#ffffff] text-[#000000] box-sizing-[border-box] m-[0_auto] text-[9pt] font-family-[Arial,_Helvetica,_sans-serif]"
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 landscape; margin: 10mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            .print-area { box-shadow: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: none !important; border: none !important; border-radius: 0 !important; min-height: auto !important; height: auto !important; }
            td, th { padding: 4px 6px; border: 1px solid #000; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          `}
        </style>

        {/* Header Res 299/11 */}
        <div className="flex justify-space-between items-center mb-[12px]">
          <div className="w-[150px]">
            <CompanyLogo style={{ maxHeight: '45px', maxWidth: '140px', objectFit: 'contain' }} />
          </div>
          <div className="text-center flex-[1]">
            <h2 className="m-[0] text-[11pt] font-[bold] uppercase tracking-wide">CONSTANCIA DE ENTREGA DE ROPA DE TRABAJO Y</h2>
            <h2 className="m-[0] text-[11pt] font-[bold] uppercase tracking-wide">ELEMENTOS DE PROTECCIÓN PERSONAL</h2>
            <p className="m-[4px_0_0_0] text-[8.5pt] font-[bold] text-[#333]">Resolución S.R.T. N° 299/11 — Anexo I</p>
          </div>
          <div className="w-[150px] text-right text-[8pt] font-bold">
            Hoja N°: 1 / 1
          </div>
        </div>

        {/* Datos del Empleador y Trabajador */}
        <table className="w-[100%] table-layout-[fixed] border-collapse-[collapse]">
          <tbody>
            <tr className="avoid-break bg-[#f0f0f0]">
              <td colSpan={2} className="font-[bold] text-center text-[8pt] py-[3px]">DATOS DEL EMPLEADOR</td>
            </tr>
            <tr className="avoid-break">
              <td className="w-[50%]"><strong>Razón Social:</strong> {emp.razonSocial}</td>
              <td className="w-[50%]"><strong>C.U.I.T. N°:</strong> {emp.cuit}</td>
            </tr>
            <tr className="avoid-break">
              <td><strong>Dirección:</strong> {emp.direccion}</td>
              <td><strong>Localidad / Provincia:</strong> {emp.localidad}</td>
            </tr>
          </tbody>
        </table>

        <table className="w-[100%] table-layout-[fixed] border-collapse-[collapse]">
          <tbody>
            <tr className="avoid-break bg-[#f0f0f0]">
              <td colSpan={3} className="font-[bold] text-center text-[8pt] py-[3px]">DATOS DEL TRABAJADOR</td>
            </tr>
            <tr className="avoid-break">
              <td colSpan={2} className="w-[66%]"><strong>Apellido y Nombre:</strong> {workerName}</td>
              <td className="w-[34%]"><strong>D.N.I. / C.U.I.L.:</strong> {workerDni}</td>
            </tr>
            <tr className="avoid-break">
              <td colSpan={3}><strong>Puesto de Trabajo / Tarea:</strong> {workerPosition}</td>
            </tr>
          </tbody>
        </table>

        <p className="text-[7.5pt] text-justify mb-[8px] leading-[1.25] text-[#222]">
          Con la firma del presente documento el trabajador declara conocer los riesgos a los que está expuesto en su puesto de trabajo, y haber recibido información y capacitación respecto del uso adecuado, conservación, mantenimiento y cuidado de los elementos de protección personal provistos (conforme Ley 19.587 Dec. 351/79 y Res. SRT 299/11). El trabajador se compromete a utilizarlos durante la jornada laboral y a solicitar su reemplazo ante deterioro o pérdida de capacidad de protección.
        </p>

        {/* Tabla de EPPs */}
        <table className="w-[100%] table-layout-[fixed] border-collapse-[collapse]">
          <thead>
            <tr className="avoid-break bg-[#f0f0f0] text-[7pt] text-center font-bold">
              <th className="w-[20%]">PRODUCTO / EPP</th>
              <th className="w-[12%]">TIPO / MODELO</th>
              <th className="w-[15%]">MARCA</th>
              <th className="w-[18%]">CERTIFICACIÓN (IRAM / AR)</th>
              <th className="w-[7%]">CANT.</th>
              <th className="w-[13%]">FECHA ENTREGA</th>
              <th className="w-[15%]">FIRMA TRABAJADOR</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, i) => (
              <tr className="avoid-break h-[22px] text-[7.5pt]" key={i}>
                <td className="px-2 font-medium">{item ? item.type : ''}</td>
                <td className="px-2 text-center">{item ? (item.model || item.custom || '-') : ''}</td>
                <td className="px-2 text-center">{item ? (item.brand || '-') : ''}</td>
                <td className="px-2 text-center font-semibold">
                  {item ? `${item.certStandard || ''} ${item.certNumber ? `(${item.certNumber})` : ''}`.trim() || 'Sello AR' : ''}
                </td>
                <td className="px-1 text-center font-bold">{item ? (item.quantity || '1') : ''}</td>
                <td className="px-2 text-center">{item ? item.purchaseDate : ''}</td>
                <td className="text-center font-mono text-[7pt] text-slate-400">
                  {item ? (item.signature ? '✓ Firmado' : '') : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Firmas finales */}
        <div className="flex justify-between items-end mt-[25px] px-8">
          <div className="w-[42%] text-center">
            <div className="border-b border-black h-[35px] mb-[4px]"></div>
            <span className="text-[8pt] font-bold block">Firma del Trabajador</span>
            <span className="text-[7pt] text-[#555] block">Aclaración: {workerName}</span>
          </div>
          <div className="w-[42%] text-center">
            <div className="border-b border-black h-[35px] mb-[4px]"></div>
            <span className="text-[8pt] font-bold block">Firma Responsable Higiene y Seguridad / Empleador</span>
            <span className="text-[7pt] text-[#555] block">Sello y Matrícula Profesional</span>
          </div>
        </div>
        
        <div className="text-center mt-[15px] text-[6.5pt] text-[#666]">
          Formulario generado mediante Asistente de Higiene y Seguridad — Modelo oficial conforme Anexo I Resolución S.R.T. N° 299/11
        </div>
      </div>
    </div>
  );
}