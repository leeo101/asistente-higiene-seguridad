import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ReportContentRenderer from '../reports/ReportContentRenderer';

describe('ReportContentRenderer', () => {
  it('renders default placeholder when content is empty', () => {
    render(<ReportContentRenderer content="" />);
    expect(screen.getByText(/Sin observaciones o contenido registrado/i)).toBeInTheDocument();
  });

  it('converts legacy plain text with double newlines into separated paragraphs', () => {
    const plainText = 'Primer párrafo con observaciones.\n\nSegundo párrafo tras salto de renglón.\n\nTercer párrafo.';
    const { container } = render(<ReportContentRenderer content={plainText} />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs.length).toBe(3);
    expect(paragraphs[0].textContent).toContain('Primer párrafo');
    expect(paragraphs[1].textContent).toContain('Segundo párrafo');
    expect(paragraphs[2].textContent).toContain('Tercer párrafo');
  });

  it('renders rich HTML content cleanly including headings, lists and callouts', () => {
    const richHtml = `
      <h2>1. OBJETIVO</h2>
      <p>Párrafo formal de inspección.</p>
      <ul>
        <li>Extintores ABC verificados</li>
        <li>Salidas de emergencia despejadas</li>
      </ul>
      <div class="report-callout report-callout-warning">
        <strong>Advertencia:</strong>
        <p>Cable expuesto en tablero secundario.</p>
      </div>
    `;
    const { container } = render(<ReportContentRenderer content={richHtml} />);
    expect(container.querySelector('h2')?.textContent).toContain('1. OBJETIVO');
    expect(container.querySelectorAll('li').length).toBe(2);
    expect(container.querySelector('.report-callout-warning')).toBeInTheDocument();
  });
});
