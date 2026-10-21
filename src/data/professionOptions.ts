export interface ProfessionGroup {
  label: string;
  options: string[];
}

export const PROFESSION_GROUPS: ProfessionGroup[] = [
  {
    label: "TÉCNICOS EN HIGIENE Y SEGURIDAD",
    options: [
      "Técnico Universitario en Higiene y Seguridad Laboral",
      "Técnico Universitario en Higiene y Seguridad en el Trabajo",
      "Técnico Superior en Higiene y Seguridad en el Trabajo",
      "Técnico en Higiene y Seguridad en el Trabajo",
      "Técnico en Higiene y Seguridad Laboral",
      "Técnico Superior en Control de Gestión Ambiental y SyST",
      "Técnico Superior en Ergonomía Ocupacional",
      "Técnico en Higiene, Seguridad y Medio Ambiente",
      "Técnico en Seguridad e Higiene Industrial",
      "Técnico en Prevención de Riesgos Laborales"
    ]
  },
  {
    label: "LICENCIADOS EN HIGIENE Y SEGURIDAD",
    options: [
      "Licenciado en Higiene y Seguridad en el Trabajo",
      "Licenciado en Higiene y Seguridad Laboral",
      "Licenciado en Seguridad, Higiene y Control Ambiental",
      "Licenciado en Gestión de la Salud y Seguridad Ocupacional",
      "Licenciado en Ergonomía Ocupacional",
      "Licenciado en Ciencias Ambientales y SyST",
      "Licenciado en Salud y Seguridad en el Trabajo"
    ]
  },
  {
    label: "INGENIEROS",
    options: [
      "Ingeniero Especialista en Higiene y Seguridad en el Trabajo",
      "Ingeniero en Seguridad Laboral y Ambiental",
      "Ingeniero Industrial con Especialización en SyST",
      "Ingeniero Laboral",
      "Ingeniero Químico / Ambiental"
    ]
  },
  {
    label: "ESPECIALISTAS Y POSGRADOS",
    options: [
      "Especialista en Ergonomía y Salud Ocupacional",
      "Auditor Líder en Sistemas de Gestión ISO 45001 / 14001",
      "Médico del Trabajo / Salud Ocupacional",
      "Perito Judicial en Higiene y Seguridad Laboral"
    ]
  }
];

export const ALL_PROFESSIONS_FLAT: string[] = PROFESSION_GROUPS.flatMap(g => g.options);

export const DEFAULT_PROFESSION = "Técnico Universitario en Higiene y Seguridad Laboral";

/**
 * Normaliza un título para mostrarlo con categoría adecuada
 */
export function formatProfessionTitle(prof?: string | null): string {
  if (!prof || prof.trim() === '') return DEFAULT_PROFESSION;
  const p = prof.trim();
  if (p === 'Técnico' || p === 'PROFESIONAL' || p === 'Profesional') {
    return DEFAULT_PROFESSION;
  }
  if (p === 'Licenciado') {
    return 'Licenciado en Higiene y Seguridad en el Trabajo';
  }
  if (p === 'Ingeniero') {
    return 'Ingeniero Especialista en Higiene y Seguridad en el Trabajo';
  }
  return p;
}
