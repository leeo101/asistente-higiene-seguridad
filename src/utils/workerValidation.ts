export interface MedicalValidationResult {
  isValid: boolean;
  status: 'apto' | 'vencido' | 'no_apto' | 'no_registrado' | 'sin_permiso_especifico';
  message: string;
  examDate?: string;
  expirationDate?: string;
  workerName?: string;
  dni?: string;
  clinic?: string;
}

export function validateWorkerMedicalStatus(
  searchTerm: string,
  riskType: 'height' | 'confined' | 'machinery' | 'electrical' | 'general' = 'general'
): MedicalValidationResult {
  if (!searchTerm || !searchTerm.trim()) {
    return {
      isValid: false,
      status: 'no_registrado',
      message: 'Ingrese DNI o nombre del trabajador para verificar aptitud médica.'
    };
  }

  const query = searchTerm.trim().toLowerCase();

  // Load medical exams from localStorage
  let exams: any[] = [];
  try {
    const rawExams = localStorage.getItem('ehs_medical_db');
    if (rawExams) exams = JSON.parse(rawExams);
  } catch (e) {
    console.error('Error al leer ehs_medical_db', e);
  }

  // Load legajos cache
  let legajos: any[] = [];
  try {
    const rawLegajos = localStorage.getItem('legajos_cache') || localStorage.getItem('legajos_db');
    if (rawLegajos) legajos = JSON.parse(rawLegajos);
  } catch (e) {
    console.error('Error al leer legajos_cache', e);
  }

  // Match exam by DNI or name
  let match = exams.find(e => 
    (e.dni && String(e.dni).toLowerCase() === query) ||
    (e.workerName && e.workerName.toLowerCase().includes(query))
  );

  // If no match in medical db, check legajos cache
  if (!match) {
    const legajoMatch = legajos.find(l => 
      (l.dni && String(l.dni).toLowerCase() === query) ||
      (l.name && l.name.toLowerCase().includes(query))
    );
    if (legajoMatch && legajoMatch.medicalExpiry) {
      match = {
        workerName: legajoMatch.name,
        dni: legajoMatch.dni,
        expirationDate: legajoMatch.medicalExpiry,
        result: legajoMatch.medicalStatus || 'apto',
        allowHeight: legajoMatch.allowHeight ?? true,
        allowConfined: legajoMatch.allowConfined ?? true,
        allowMachinery: legajoMatch.allowMachinery ?? true,
        allowElectrical: legajoMatch.allowElectrical ?? true
      };
    }
  }

  // If no match yet, check contractor workers matrix (contractors_matrix_workers)
  if (!match) {
    try {
      const rawContractorWorkers = localStorage.getItem('contractors_matrix_workers');
      if (rawContractorWorkers) {
        const contractorWorkers = JSON.parse(rawContractorWorkers);
        const cwMatch = contractorWorkers.find((cw: any) => 
          (cw.dni && String(cw.dni).toLowerCase() === query) ||
          (cw.workerName && cw.workerName.toLowerCase().includes(query))
        );
        if (cwMatch) {
          match = {
            workerName: cwMatch.workerName,
            dni: cwMatch.dni,
            expirationDate: cwMatch.aptoMedicoDate || cwMatch.certEspecialDate,
            result: cwMatch.aptoMedicoDate ? 'apto' : 'vencido',
            allowHeight: true,
            allowConfined: true,
            allowElectrical: true,
            allowMachinery: true
          };
        }
      }
    } catch (e) {
      console.error('Error al leer contractors_matrix_workers', e);
    }
  }

  if (!match) {
    return {
      isValid: false,
      status: 'no_registrado',
      message: `No se encontró registro de examen médico para "${searchTerm}".`
    };
  }

  const today = new Date().toISOString().split('T')[0];
  const isExpired = match.expirationDate && match.expirationDate < today;

  if (match.result === 'no_apto') {
    return {
      isValid: false,
      status: 'no_apto',
      message: `🔴 Trabajador ${match.workerName || searchTerm}: Dictamen médico NO APTO.`,
      examDate: match.examDate,
      expirationDate: match.expirationDate,
      workerName: match.workerName,
      dni: match.dni,
      clinic: match.clinic
    };
  }

  if (isExpired) {
    return {
      isValid: false,
      status: 'vencido',
      message: `⚠️ Trabajador ${match.workerName || searchTerm}: Examen médico VENCIDO el ${match.expirationDate}.`,
      examDate: match.examDate,
      expirationDate: match.expirationDate,
      workerName: match.workerName,
      dni: match.dni,
      clinic: match.clinic
    };
  }

  // Check specific risk permission if required
  if (riskType === 'height' && match.allowHeight === false) {
    return {
      isValid: false,
      status: 'sin_permiso_especifico',
      message: `⚠️ Trabajador ${match.workerName || searchTerm}: Apto general vigente pero NO AUTORIZADO para Trabajo en Altura.`,
      examDate: match.examDate,
      expirationDate: match.expirationDate,
      workerName: match.workerName,
      dni: match.dni
    };
  }

  if (riskType === 'confined' && match.allowConfined === false) {
    return {
      isValid: false,
      status: 'sin_permiso_especifico',
      message: `⚠️ Trabajador ${match.workerName || searchTerm}: Apto general vigente pero NO AUTORIZADO para Espacios Confinados.`,
      examDate: match.examDate,
      expirationDate: match.expirationDate,
      workerName: match.workerName,
      dni: match.dni
    };
  }

  if (riskType === 'electrical' && match.allowElectrical === false) {
    return {
      isValid: false,
      status: 'sin_permiso_especifico',
      message: `⚠️ Trabajador ${match.workerName || searchTerm}: Apto general vigente pero NO AUTORIZADO para Trabajo Eléctrico/LOTO.`,
      examDate: match.examDate,
      expirationDate: match.expirationDate,
      workerName: match.workerName,
      dni: match.dni
    };
  }

  if (riskType === 'machinery' && match.allowMachinery === false) {
    return {
      isValid: false,
      status: 'sin_permiso_especifico',
      message: `⚠️ Trabajador ${match.workerName || searchTerm}: Apto general vigente pero NO AUTORIZADO para Operar Maquinaria.`,
      examDate: match.examDate,
      expirationDate: match.expirationDate,
      workerName: match.workerName,
      dni: match.dni
    };
  }

  return {
    isValid: true,
    status: 'apto',
    message: `🟢 Trabajador ${match.workerName || searchTerm}: Apto Médico VIGENTE hasta el ${match.expirationDate || 'N/D'}.`,
    examDate: match.examDate,
    expirationDate: match.expirationDate,
    workerName: match.workerName,
    dni: match.dni,
    clinic: match.clinic
  };
}
