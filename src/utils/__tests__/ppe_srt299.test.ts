import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  evaluateSinglePPEItem,
  evaluatePPEWorkerCompliance,
  evaluatePPEFleetCompliance,
  calculatePPEExpiryDays,
  OFFICIAL_PPE_REGULATORY_CRITERIA,
} from '../srtProtocols';
import { OFFICIAL_PPE_USEFUL_LIFE, CRITICAL_PPE_TYPES } from '../../types/ppe';

// Helper: genera fecha ISO a N días en el futuro/pasado desde hoy
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Helper: genera una fecha de compra que vence en N días (con vida útil de 12 meses)
function purchaseDateForExpiryInDays(days: number, lifeMonths = 12): string {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  const purchase = new Date(expiry);
  purchase.setMonth(purchase.getMonth() - lifeMonths);
  return purchase.toISOString().split('T')[0];
}

describe('Módulo 14 — EPP Res. SRT 299/11 & Res. SIyC 18/25', () => {

  describe('calculatePPEExpiryDays', () => {
    it('retorna null para datos faltantes', () => {
      expect(calculatePPEExpiryDays('', 12).days).toBeNull();
      expect(calculatePPEExpiryDays('2025-01-01', 0).days).toBeNull();
    });

    it('calcula correctamente días restantes', () => {
      const purchaseDate = purchaseDateForExpiryInDays(90, 12);
      const { days } = calculatePPEExpiryDays(purchaseDate, 12);
      expect(days).not.toBeNull();
      // Tolerancia de ±2 días por redondeo de meses
      expect(Math.abs(days! - 90)).toBeLessThanOrEqual(2);
    });
  });

  describe('evaluateSinglePPEItem', () => {
    it('EPP vigente con certificación → VIGENTE', () => {
      const result = evaluateSinglePPEItem({
        type: 'Casco de seguridad',
        purchaseDate: purchaseDateForExpiryInDays(200, 60),
        lifeMonths: 60,
        certStandard: 'IRAM',
        certNumber: 'AR-2025-001234',
      });
      expect(result.status).toBe('VIGENTE');
      expect(result.isExpired).toBe(false);
      expect(result.hasCertification).toBe(true);
      expect(result.certificationMissing).toBe(false);
      expect(result.isCriticalType).toBe(true);
    });

    it('EPP vencido → VENCIDO', () => {
      const result = evaluateSinglePPEItem({
        type: 'Calzado de seguridad',
        purchaseDate: purchaseDateForExpiryInDays(-30, 12),
        lifeMonths: 12,
        certStandard: 'IRAM',
        certNumber: 'AR-2024-009999',
      });
      expect(result.status).toBe('VENCIDO');
      expect(result.isExpired).toBe(true);
    });

    it('EPP por vencer en 20 días → POR_VENCER', () => {
      const result = evaluateSinglePPEItem({
        type: 'Guantes de trabajo',
        purchaseDate: purchaseDateForExpiryInDays(20, 6),
        lifeMonths: 6,
      });
      expect(result.status).toBe('POR_VENCER');
      expect(result.isExpiringSoon).toBe(true);
    });

    it('Arnés sin certificación → certificationMissing = true', () => {
      const result = evaluateSinglePPEItem({
        type: 'Arnés de seguridad',
        purchaseDate: purchaseDateForExpiryInDays(300, 60),
        lifeMonths: 60,
        certStandard: '',
        certNumber: '',
      });
      expect(result.isCriticalType).toBe(true);
      expect(result.certificationRequired).toBe(true);
      expect(result.certificationMissing).toBe(true);
      expect(result.hasCertification).toBe(false);
    });
  });

  describe('evaluatePPEWorkerCompliance', () => {
    it('Todos vigentes y certificados → CONFORME', () => {
      const result = evaluatePPEWorkerCompliance([
        {
          type: 'Casco de seguridad',
          responsible: 'Juan Pérez',
          workerDni: '30123456',
          puesto: 'Operario',
          purchaseDate: purchaseDateForExpiryInDays(300, 60),
          lifeMonths: 60,
          certStandard: 'IRAM',
          certNumber: 'AR-2025-001',
        },
        {
          type: 'Calzado de seguridad',
          responsible: 'Juan Pérez',
          workerDni: '30123456',
          puesto: 'Operario',
          purchaseDate: purchaseDateForExpiryInDays(120, 12),
          lifeMonths: 12,
          certStandard: 'ISO',
          certNumber: 'ISO-2024-999',
        },
      ]);
      expect(result.dictamen).toBe('CONFORME');
      expect(result.vencidos).toBe(0);
      expect(result.sinCertCritica).toBe(0);
      expect(result.workerName).toBe('Juan Pérez');
    });

    it('EPP vencido → NO CONFORME', () => {
      const result = evaluatePPEWorkerCompliance([
        {
          type: 'Guantes de trabajo',
          responsible: 'María López',
          purchaseDate: purchaseDateForExpiryInDays(-15, 6),
          lifeMonths: 6,
        },
      ]);
      expect(result.dictamen).toBe('NO CONFORME');
      expect(result.vencidos).toBe(1);
      expect(result.observaciones.some(o => o.includes('VENCIDO'))).toBe(true);
    });

    it('EPP crítico sin certificación → NO CONFORME', () => {
      const result = evaluatePPEWorkerCompliance([
        {
          type: 'Mascarilla / Respirador',
          responsible: 'Carlos Ruiz',
          purchaseDate: purchaseDateForExpiryInDays(100, 6),
          lifeMonths: 6,
          certStandard: '',
          certNumber: '',
        },
      ]);
      expect(result.dictamen).toBe('NO CONFORME');
      expect(result.sinCertCritica).toBe(1);
      expect(result.observaciones.some(o => o.includes('SIN CERTIFICACION'))).toBe(true);
    });

    it('EPP por vencer → OBSERVADO', () => {
      const result = evaluatePPEWorkerCompliance([
        {
          type: 'Lentes de seguridad',
          responsible: 'Ana García',
          purchaseDate: purchaseDateForExpiryInDays(15, 24),
          lifeMonths: 24,
          certStandard: 'ANSI',
          certNumber: 'Z87.1-2025',
        },
      ]);
      expect(result.dictamen).toBe('OBSERVADO');
      expect(result.porVencer).toBe(1);
    });
  });

  describe('evaluatePPEFleetCompliance', () => {
    it('Flota con mezcla de estados → dictamen global correcto', () => {
      const result = evaluatePPEFleetCompliance([
        {
          type: 'Casco de seguridad',
          responsible: 'Juan Pérez',
          purchaseDate: purchaseDateForExpiryInDays(300, 60),
          lifeMonths: 60,
          certStandard: 'IRAM',
          certNumber: 'AR-001',
        },
        {
          type: 'Calzado de seguridad',
          responsible: 'María López',
          purchaseDate: purchaseDateForExpiryInDays(-5, 12),
          lifeMonths: 12,
          certStandard: 'ISO',
          certNumber: 'ISO-002',
        },
      ]);
      expect(result.fleetDictamen).toBe('NO CONFORME');
      expect(result.totalWorkers).toBe(2);
      expect(result.totalItems).toBe(2);
      expect(result.totalVencidos).toBe(1);
      expect(result.totalVigentes).toBe(1);
    });

    it('Flota 100% conforme → CONFORME', () => {
      const result = evaluatePPEFleetCompliance([
        {
          type: 'Chaleco reflectivo',
          responsible: 'Pedro Sánchez',
          purchaseDate: purchaseDateForExpiryInDays(200, 12),
          lifeMonths: 12,
        },
        {
          type: 'Lentes de seguridad',
          responsible: 'Pedro Sánchez',
          purchaseDate: purchaseDateForExpiryInDays(400, 24),
          lifeMonths: 24,
        },
      ]);
      expect(result.fleetDictamen).toBe('CONFORME');
      expect(result.fleetCoveragePercent).toBe(100);
    });
  });

  describe('Constantes regulatorias', () => {
    it('vida útil referencial tiene todos los tipos estándar', () => {
      expect(OFFICIAL_PPE_USEFUL_LIFE['Casco de seguridad']).toBe(60);
      expect(OFFICIAL_PPE_USEFUL_LIFE['Guantes dieléctricos']).toBe(6);
      expect(OFFICIAL_PPE_USEFUL_LIFE['Arnés de seguridad']).toBe(60);
      expect(Object.keys(OFFICIAL_PPE_USEFUL_LIFE).length).toBeGreaterThanOrEqual(18);
    });

    it('tipos críticos incluyen EPP de seguridad obligatoria', () => {
      expect(CRITICAL_PPE_TYPES).toContain('Casco de seguridad');
      expect(CRITICAL_PPE_TYPES).toContain('Arnés de seguridad');
      expect(CRITICAL_PPE_TYPES).toContain('Guantes dieléctricos');
      expect(CRITICAL_PPE_TYPES).toContain('Mascarilla / Respirador');
      expect(CRITICAL_PPE_TYPES.length).toBeGreaterThanOrEqual(6);
    });
  });
});
