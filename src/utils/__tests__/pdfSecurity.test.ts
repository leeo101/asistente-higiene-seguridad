import { describe, it, expect } from 'vitest';
import { generateDocumentHash } from '../pdfSecurity';

describe('pdfSecurity utility', () => {
  it('debe generar un hash SHA-256 de 64 caracteres en formato hexadecimal', async () => {
    const payload = { id: 'TEST-123', user: 'auditor@empresa.com', date: '2026-08-21' };
    const hash = await generateDocumentHash(payload);
    
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('debe generar hashes idénticos para datos idénticos', async () => {
    const dataA = { doc: 'INSP-999', status: 'OK' };
    const dataB = { doc: 'INSP-999', status: 'OK' };

    const hashA = await generateDocumentHash(dataA);
    const hashB = await generateDocumentHash(dataB);

    expect(hashA).toBe(hashB);
  });

  it('debe generar hashes diferentes si el contenido cambia', async () => {
    const dataA = { doc: 'INSP-999', status: 'OK' };
    const dataB = { doc: 'INSP-999', status: 'ALTERADO' };

    const hashA = await generateDocumentHash(dataA);
    const hashB = await generateDocumentHash(dataB);

    expect(hashA).not.toBe(hashB);
  });
});
