/**
 * Registry central de cuentas PRO y Administradores.
 * Garantiza que ninguna cuenta registrada pierda el acceso PRO por fallos de red,
 * problemas de caché de Firebase Token o borrado de localStorage.
 */

export interface ProAccountRule {
  email: string;
  type: 'admin' | 'permanent_pro' | 'monthly';
  expiry?: number; // Timestamp ms para cuentas mensuales
  note?: string;
}

export const AUTHORIZED_PRO_REGISTRY: ProAccountRule[] = [
  {
    email: 'enzorodriguez31@gmail.com',
    type: 'admin',
    note: 'Administrador Principal'
  },
  {
    email: 'admin@asistentehs.com',
    type: 'admin',
    note: 'Cuenta Administradora'
  },
  {
    email: 'arielalaniz9@gmail.com',
    type: 'permanent_pro',
    note: 'Suscripción Vitalicia / PRO'
  },
  {
    email: 'joaquintunut@gmail.com',
    type: 'monthly',
    expiry: new Date('2026-08-15T23:59:59Z').getTime(), // Pago 16 de Julio de 2026 -> Vence 15 de Agosto de 2026
    note: 'Suscripción mensual por pago'
  },
  {
    email: 'abelparada09@gmail.com',
    type: 'monthly',
    expiry: new Date('2026-09-30T23:59:59Z').getTime(), // Activación PRO 1 mes (30 Agosto 2026 -> 30 Septiembre 2026)
    note: 'Suscripción mensual por pago'
  }
];

export interface EvaluationResult {
  isPro: boolean;
  isAdmin: boolean;
  expiry: number | null;
}

export function evaluateProAccess(email?: string | null): EvaluationResult {
  if (!email) {
    return { isPro: false, isAdmin: false, expiry: null };
  }

  const normalized = email.toLowerCase().trim();
  const rule = AUTHORIZED_PRO_REGISTRY.find(r => r.email.toLowerCase() === normalized);

  if (!rule) {
    return { isPro: false, isAdmin: false, expiry: null };
  }

  if (rule.type === 'admin') {
    return { isPro: true, isAdmin: true, expiry: null };
  }

  if (rule.type === 'permanent_pro') {
    return { isPro: true, isAdmin: false, expiry: null };
  }

  if (rule.type === 'monthly') {
    const isValid = rule.expiry ? Date.now() <= rule.expiry : false;
    return { isPro: isValid, isAdmin: false, expiry: rule.expiry || null };
  }

  return { isPro: false, isAdmin: false, expiry: null };
}
