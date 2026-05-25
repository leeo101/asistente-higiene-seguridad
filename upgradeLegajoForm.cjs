const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'LegajoForm.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add SignatureCanvas and PenTool import
if (!content.includes('SignatureCanvas')) {
  content = content.replace(
    "import { \n  Building2, ",
    "import SignatureCanvas from '../components/SignatureCanvas';\nimport { \n  Building2, \n  PenTool, "
  );
}

// 2. Add 'firmas' to TABS
if (!content.includes("id: 'firmas'")) {
  content = content.replace(
    "{ id: 'ambiente', label: 'Medio Ambiente', icon: Wind },",
    "{ id: 'ambiente', label: 'Medio Ambiente', icon: Wind },\n  { id: 'firmas', label: 'Firmas', icon: PenTool },"
  );
}

// 3. Update formData initial state
if (!content.includes("firmas: {")) {
  content = content.replace(
    "ambiente: {\n      iluminacionFecha: '',\n      iluminacionApto: true,\n      ruidoFecha: '',\n      ruidoApto: true,\n      puestaTierraFecha: '',\n      puestaTierraApto: true\n    }",
    "ambiente: {\n      iluminacionFecha: '',\n      iluminacionApto: true,\n      ruidoFecha: '',\n      ruidoApto: true,\n      puestaTierraFecha: '',\n      puestaTierraApto: true\n    },\n    firmas: {\n      profesional: '',\n      representante: ''\n    }"
  );
}

// 4. Update loadLegajo
if (!content.includes("firmas: data.firmas")) {
  content = content.replace(
    "ambiente: data.ambiente || formData.ambiente,",
    "ambiente: data.ambiente || formData.ambiente,\n          firmas: data.firmas || formData.firmas,"
  );
}

// 5. Add 'firmas' tab content
const firmasTabContent = `
        {/* FIRMAS TAB */}
        {activeTab === 'firmas' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Firmas del Documento</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
            </div>
          </div>
        )}
`;

if (!content.includes("FIRMAS TAB")) {
  content = content.replace(
    "        {/* AMBIENTE TAB */}",
    firmasTabContent + "\n        {/* AMBIENTE TAB */}"
  );
}

// 6. Make inputs premium
const premiumInputClass = '"w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"';
const premiumSelectClass = '"w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm appearance-none"';
const premiumTextareaClass = '"w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm resize-none"';

content = content.replace(/className="w-full p-2\.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"/g, `className=${premiumInputClass}`);
content = content.replace(/className="w-full p-2\.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"/g, `className=${premiumTextareaClass}`);
content = content.replace(/className="w-full p-2\.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/g, `className=${premiumInputClass}`);
content = content.replace(/className="w-full p-2\.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"/g, `className=${premiumSelectClass}`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully upgraded LegajoForm.tsx');
