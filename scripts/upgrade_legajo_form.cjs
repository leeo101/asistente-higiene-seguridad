const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'pages', 'LegajoForm.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Inputs premium
const premiumRegex = /className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500\/20 focus:border-blue-500 outline-none transition-all shadow-sm[ a-zA-Z-]*"/g;
content = content.replace(premiumRegex, 'className="toolbox-input-plain" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}');

// 2. Add PdfSignatures
if (!content.includes('PdfSignatures')) {
  content = content.replace(
    "import SignatureCanvas from '../components/SignatureCanvas';",
    "import SignatureCanvas from '../components/SignatureCanvas';\nimport PdfSignatures from '../components/PdfSignatures';\nimport { Printer, Share2 } from 'lucide-react';"
  );
}

// 3. Update the firm tab to look like ATS
const oldFirmas = `            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">Firma del Profesional</label>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <SignatureCanvas 
                    onSave={(sig) => handleChange('firmas', 'profesional', sig)}
                    initialSignature={formData.firmas.profesional}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">Firma Representante Empresa</label>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <SignatureCanvas 
                    onSave={(sig) => handleChange('firmas', 'representante', sig)}
                    initialSignature={formData.firmas.representante}
                  />
                </div>
              </div>
            </div>`;

const newFirmas = `            <div style={{ marginBottom: '2.5rem' }}>
              <PdfSignatures
                  data={{
                      ...formData,
                      professionalSignature: formData.firmas.profesional,
                      professionalName: currentUser?.displayName || 'Profesional H&S',
                      companyName: formData.empresa.razonSocial || 'Empresa'
                  }}
                  box1={{
                      title: 'REPRESENTANTE EMPRESA',
                      subtitle: (formData.empresa.razonSocial || 'Firma Representante').toUpperCase(),
                      signatureUrl: formData.firmas.representante || null,
                      isProfessional: false
                  }}
                  box2={{
                      title: 'PROFESIONAL H&S',
                      subtitle: (currentUser?.displayName || 'Especialista H&S').toUpperCase(),
                      signatureUrl: formData.firmas.profesional || null,
                      stampUrl: null,
                      isProfessional: true,
                      license: 'Matrícula en trámite'
                  }}
                  box3={null}
              />
            </div>

            <div className="no-print animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    <div className="card" style={{ padding: '1rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)' }}>
                        <SignatureCanvas 
                            onSave={(sig) => handleChange('firmas', 'representante', sig)}
                            initialImage={formData.firmas.representante}
                            label="Firma Representante Empresa"
                        />
                    </div>
                    
                    <div className="card" style={{ padding: '1rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)' }}>
                        <SignatureCanvas 
                            onSave={(sig) => handleChange('firmas', 'profesional', sig)}
                            initialImage={formData.firmas.profesional}
                            label="Firma Profesional H&S"
                        />
                    </div>
                </div>
            </div>`;

content = content.replace(oldFirmas, newFirmas);

// 4. Update the main form container to be premium card
content = content.replace(
  'className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"',
  'className="card" style={{ padding: "2rem", background: "var(--gradient-card)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-2xl)", boxShadow: "var(--glass-shadow)" }}'
);

// 5. Add Floating Action Bar
if (!content.includes('floating-action-bar')) {
  const fab = `
      <div className="no-print floating-action-bar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--color-header-bg)', backdropFilter: 'blur(10px)', borderTop: '1px solid var(--color-border)', padding: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem', zIndex: 100 }}>
          {id && (
            <button
                onClick={handleGeneratePDF}
                className="btn-floating-action"
                style={{ background: '#FF8B00', color: '#ffffff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,139,0,0.3)' }}
            >
                <Printer size={18} /> IMPRIMIR PDF
            </button>
          )}
          <button
              onClick={handleSave}
              className="btn-floating-action"
              style={{ background: '#36B37E', color: '#ffffff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(54,179,126,0.3)' }}
          >
              <Save size={18} /> GUARDAR LEGAJO
          </button>
      </div>`;
      
  content = content.replace(
    '    </div>\n  );\n}\n',
    `${fab}\n    </div>\n  );\n}\n`
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Script updated legajo form successfully!');
