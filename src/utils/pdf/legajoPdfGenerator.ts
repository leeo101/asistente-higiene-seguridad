import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateLegajoPDF = async (data: any) => {
  const pdf = new jsPDF();
  let yOffset = 20;
  
  // Helpers
  const addHeader = (text: string) => {
    pdf.setFillColor(30, 64, 175); // Blue 800
    pdf.rect(14, yOffset - 6, 182, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(text, 16, yOffset + 1);
    yOffset += 15;
  };

  const addField = (label: string, value: string, isFullWidth = false) => {
    if (yOffset > 270) {
      pdf.addPage();
      yOffset = 20;
    }
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${label}:`, 14, yOffset);
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    
    if (isFullWidth) {
      const splitText = pdf.splitTextToSize(value || 'No especificado', 180);
      pdf.text(splitText, 14, yOffset + 5);
      yOffset += (splitText.length * 5) + 10;
    } else {
      pdf.text(value || 'No especificado', 70, yOffset);
      yOffset += 10;
    }
  };

  // COVER PAGE
  pdf.setFontSize(24);
  pdf.setTextColor(30, 64, 175);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LEGAJO TÉCNICO', 105, 120, { align: 'center' });
  
  pdf.setFontSize(16);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Higiene y Seguridad en el Trabajo', 105, 130, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text('Decreto 351/79 - Ley 19.587', 105, 140, { align: 'center' });
  
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.text(data.empresa.razonSocial || 'Empresa Sin Nombre', 105, 170, { align: 'center' });

  pdf.setFontSize(10);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, 105, 280, { align: 'center' });

  // PAGE 2: DATOS DE LA EMPRESA
  pdf.addPage();
  yOffset = 20;
  
  addHeader('1. DATOS DEL ESTABLECIMIENTO');
  addField('Razón Social', data.empresa.razonSocial);
  addField('CUIT', data.empresa.cuit);
  addField('Domicilio', data.empresa.domicilio);
  addField('Localidad', data.empresa.localidad);
  addField('Actividad Principal', data.empresa.actividad);
  addField('ART', data.empresa.art);
  addField('Cantidad de Empleados', data.empresa.cantidadEmpleados?.toString());
  addField('Superficie Cubierta (m²)', data.empresa.superficie?.toString());

  // PAGE 3: RIESGOS
  yOffset += 10;
  addHeader('2. IDENTIFICACIÓN DE RIESGOS Y MEDIDAS');
  addField('Riesgos Físicos Presentes', data.riesgos.fisicos, true);
  addField('Riesgos Químicos/Biológicos', data.riesgos.quimicos, true);
  addField('Medidas Preventivas Adoptadas', data.riesgos.medidasPreventivas, true);

  // PAGE 4: INCENDIO
  pdf.addPage();
  yOffset = 20;
  addHeader('3. PROTECCIÓN CONTRA INCENDIOS');
  addField('Carga de Fuego (Mcal/m²)', data.incendio.cargaFuego);
  addField('Riesgo de Incendio', data.incendio.riesgoIncendio);
  addField('Cantidad Total de Extintores', data.incendio.cantidadExtintores?.toString());
  addField('Plan de Evacuación Aprobado', data.incendio.planEvacuacion ? 'SÍ, CUENTA CON PLAN' : 'NO POSEE');

  // PAGE 5: EPP & CAPACITACION
  yOffset += 10;
  addHeader('4. EPP Y CAPACITACIÓN (Res. 299/11)');
  
  const eppList = [];
  if (data.epp.ropaTrabajo) eppList.push("Ropa de Trabajo");
  if (data.epp.calzadoSeguridad) eppList.push("Calzado de Seguridad");
  if (data.epp.proteccionOcular) eppList.push("Protección Ocular");
  if (data.epp.proteccionAuditiva) eppList.push("Protección Auditiva");
  if (data.epp.proteccionRespiratoria) eppList.push("Protección Respiratoria");
  
  addField('EPP Entregados al Personal', eppList.length > 0 ? eppList.join(', ') : 'No registrados', true);
  addField('Última Capacitación General', data.epp.capacitacionRealizada, true);
  addField('Próxima Capacitación Programada', data.epp.proximaCapacitacion, true);

  // PAGE 6: AMBIENTE LABORAL
  pdf.addPage();
  yOffset = 20;
  addHeader('5. ESTUDIOS DE MEDIO AMBIENTE LABORAL');
  
  autoTable(pdf, {
    startY: yOffset,
    head: [['Estudio', 'Normativa', '¿Cumple Apto?', 'Fecha de Medición']],
    body: [
      ['Iluminación en puestos', 'Res. 84/12 SRT', data.ambiente.iluminacionApto ? 'SÍ' : 'NO', data.ambiente.iluminacionFecha || 'Sin registro'],
      ['Ruido en ambiente', 'Res. 85/12 SRT', data.ambiente.ruidoApto ? 'SÍ' : 'NO', data.ambiente.ruidoFecha || 'Sin registro'],
      ['Puesta a Tierra (PAT)', 'Res. 900/15 SRT', data.ambiente.puestaTierraApto ? 'SÍ' : 'NO', data.ambiente.puestaTierraFecha || 'Sin registro'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175] },
  });

  // SIGNATURE AREA
  yOffset = (pdf as any).lastAutoTable.finalY + 40;
  pdf.line(120, yOffset, 180, yOffset);
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Firma y Sello del Profesional', 150, yOffset + 5, { align: 'center' });
  pdf.text('Higiene y Seguridad en el Trabajo', 150, yOffset + 10, { align: 'center' });

  // SAVE PDF
  pdf.save(`Legajo_Tecnico_${data.empresa.razonSocial?.replace(/\s+/g, '_') || 'Empresa'}.pdf`);
};
