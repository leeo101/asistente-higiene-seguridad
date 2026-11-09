import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  User,
  Mail,
  CreditCard,
  Award,
  Phone,
  MapPin,
  Camera,
  Trash2,
  GraduationCap,
  Globe,
  CheckCircle2,
  Building2,
  Briefcase,
  ArrowLeft,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { countryList, getCountryNormativa } from '../data/legislationData';
import {
  PROFESSION_GROUPS,
  ALL_PROFESSIONS_FLAT,
  DEFAULT_PROFESSION
} from '../data/professionOptions';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import PremiumHeader from '../components/PremiumHeader';
import toast from 'react-hot-toast';

interface PersonalFormData {
  [key: string]: unknown;
  name: string;
  email: string;
  dni: string;
  license: string;
  phone: string;
  address: string;
  country: string;
  photo: string | null;
  profession: string;
  college: string;
  specialty: string;
  bio: string;
}

const FieldLabel = ({
  icon,
  label,
  badge
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
}) => (
  <div className="flex items-center justify-between gap-2 mb-1.5">
    <label
      className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider m-0"
      style={{ color: 'var(--color-text)' }}
    >
      <span style={{ color: '#2563eb' }}>{icon}</span>
      {label}
    </label>
    {badge && (
      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
        style={{
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          color: '#2563eb'
        }}
      >
        {badge}
      </span>
    )}
  </div>
);

export default function PersonalData(): React.ReactElement | null {
  const navigate = useNavigate();
  const { syncDocument } = useSync();
  const { currentUser } = useAuth();
  const { selectedFramework, setSelectedFramework } = useLanguage();
  useDocumentTitle('Datos Personales y Matrícula');

  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [saved, setSaved] = useState(false);
  const [isCustomTitle, setIsCustomTitle] = useState(false);
  const [formData, setFormData] = useState<PersonalFormData>({
    name: currentUser?.displayName || 'Profesional H&S',
    email: currentUser?.email || '',
    dni: '',
    license: '',
    phone: '',
    address: '',
    country: selectedFramework || 'argentina',
    photo: null,
    profession: DEFAULT_PROFESSION,
    college: 'COPIME / Colegio Profesional H&S',
    specialty: 'Seguridad Industrial, Ergonomía y Medio Ambiente',
    bio: 'Especialista habilitado para auditorías técnicas, relevamientos legales y capacitaciones.'
  });

  useEffect(() => {
    const savedData = localStorage.getItem('personalData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (
          !parsed.profession ||
          parsed.profession === 'Técnico' ||
          parsed.profession === 'PROFESIONAL'
        ) {
          parsed.profession = DEFAULT_PROFESSION;
        }
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          country: parsed.country || selectedFramework || 'argentina'
        }));
        if (parsed.profession && !ALL_PROFESSIONS_FLAT.includes(parsed.profession)) {
          setIsCustomTitle(true);
        }
      } catch {
        // ignore parse error
      }
    } else {
      const initial: PersonalFormData = {
        name: currentUser?.displayName || 'Profesional H&S',
        email: currentUser?.email || '',
        dni: '',
        license: '',
        phone: '',
        address: '',
        country: selectedFramework || 'argentina',
        photo: null,
        profession: DEFAULT_PROFESSION,
        college: 'COPIME / Colegio Profesional H&S',
        specialty: 'Seguridad Industrial, Ergonomía y Medio Ambiente',
        bio: ''
      };
      localStorage.setItem('personalData', JSON.stringify(initial));
      setFormData(initial);
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedFramework && formData.country !== selectedFramework) {
      setFormData((prev) => ({ ...prev, country: selectedFramework }));
    }
  }, [selectedFramework]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      localStorage.setItem('personalData', JSON.stringify(formData));
      setSelectedFramework(formData.country);
      await syncDocument('personalData', formData);
      setSaved(true);
      toast.success('Datos profesionales guardados correctamente');
      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch {
      localStorage.setItem('personalData', JSON.stringify(formData));
      toast.success('Datos guardados en el dispositivo');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Seleccioná una imagen válida (JPG, PNG o WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxSize = 600;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFormData((prev) => ({ ...prev, photo: compressedDataUrl }));
          toast.success('Foto de perfil cargada');
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, photo: null }));
    toast.success('Foto eliminada');
  };

  const inputStyle: React.CSSProperties = {
    marginBottom: 0,
    width: '100%',
    padding: '0.7rem 0.9rem',
    backgroundColor: 'var(--color-background)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.85rem',
    color: 'var(--color-text)',
    fontSize: '0.9rem',
    fontWeight: 600,
    outline: 'none',
    boxSizing: 'border-box'
  };

  const countryNorms = getCountryNormativa(formData.country || 'argentina');

  return (
    <div
      className="container max-w-6xl mx-auto px-3 sm:px-6 animate-fade-in"
      style={{ paddingTop: '7.25rem', paddingBottom: '6.5rem' }}
    >
      {/* Strictly hidden file input */}
      <input
        ref={photoInputRef}
        id="photo-upload"
        type="file"
        accept="image/*"
        onChange={handlePhotoChange}
        style={{
          display: 'none',
          width: 0,
          height: 0,
          opacity: 0,
          position: 'absolute',
          pointerEvents: 'none'
        }}
      />

      {/* Premium Header */}
      <div className="mb-5 sm:mb-6">
        <PremiumHeader
          title="Datos Personales y Matrícula Profesional"
          subtitle="Completá tu información técnica y habilitación profesional para el pie de firma de todos tus informes."
          icon={<User className="w-7 h-7" />}
          gradient="linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)"
          badge={formData.license ? `Matrícula: ${formData.license}` : 'Ficha Profesional'}
          onBack={() => navigate('/profile')}
        />
      </div>

      {/* Main Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* LEFT COLUMN (7 cols on desktop): Editable Form */}
        <form onSubmit={handleSave} className="lg:col-span-7 flex flex-col gap-5">
          {/* Card 1: Identidad y Título Profesional */}
          <div
            className="rounded-3xl p-4 sm:p-6 shadow-sm text-left"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)'
            }}
          >
            <div
              className="flex items-center justify-between gap-3 pb-4 mb-5 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    color: '#2563eb',
                    border: '1px solid rgba(37, 99, 235, 0.25)'
                  }}
                >
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black m-0" style={{ color: 'var(--color-text)' }}>
                    Identidad y Habilitación Profesional
                  </h2>
                  <p className="text-xs sm:text-sm m-0" style={{ color: 'var(--color-text-light)' }}>
                    Estos datos aparecen en la firma técnica de tus documentos oficiales.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <FieldLabel
                  icon={<User size={14} />}
                  label="Nombre y Apellido Completo"
                  badge="En Reportes PDF"
                />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Ing. Juan Ignacio Pérez"
                  style={inputStyle}
                />
              </div>

              <div>
                <FieldLabel
                  icon={<GraduationCap size={14} />}
                  label="Título / Profesión Habilitante"
                  badge="Pie de Firma"
                />
                <select
                  value={isCustomTitle ? 'CUSTOM_OPTION' : formData.profession}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'CUSTOM_OPTION') {
                      setIsCustomTitle(true);
                      setFormData({ ...formData, profession: '' });
                    } else {
                      setIsCustomTitle(false);
                      setFormData({ ...formData, profession: val });
                    }
                  }}
                  style={inputStyle}
                >
                  <option value="">Seleccioná tu título profesional...</option>
                  {PROFESSION_GROUPS.map((grp) => (
                    <optgroup key={grp.label} label={grp.label}>
                      {grp.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="CUSTOM_OPTION">✍️ Otro Título / Personalizado...</option>
                </select>

                {isCustomTitle && (
                  <input
                    type="text"
                    placeholder="Escribí tu título profesional completo..."
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    style={{ ...inputStyle, marginTop: '0.6rem' }}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <FieldLabel icon={<Award size={14} />} label="Matrícula Profesional" />
                  <input
                    type="text"
                    value={formData.license}
                    onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                    placeholder="Ej: MP 5567 / L-10492"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <FieldLabel icon={<CreditCard size={14} />} label="DNI / Cédula / RUT" />
                  <input
                    type="text"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    placeholder="Ej: 30.123.456"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <FieldLabel icon={<Building2 size={14} />} label="Colegio / Consejo Profesional" />
                  <input
                    type="text"
                    value={formData.college || ''}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    placeholder="Ej: COPIME / CPTBA / CPSH"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <FieldLabel icon={<Briefcase size={14} />} label="Especialidad Técnica" />
                  <input
                    type="text"
                    value={formData.specialty || ''}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    placeholder="Ej: Higiene Industrial y Ergonomía"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Contacto y Jurisdicción Legal */}
          <div
            className="rounded-3xl p-4 sm:p-6 shadow-sm text-left"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)'
            }}
          >
            <div
              className="flex items-center gap-3 pb-4 mb-5 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#059669',
                  border: '1px solid rgba(16, 185, 129, 0.25)'
                }}
              >
                <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black m-0" style={{ color: 'var(--color-text)' }}>
                  Contacto y Jurisdicción Normativa
                </h2>
                <p className="text-xs sm:text-sm m-0" style={{ color: 'var(--color-text-light)' }}>
                  Definí tu país para adaptar automáticamente las leyes y decretos en la app.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <FieldLabel
                  icon={<Globe size={14} />}
                  label="País / Marco Normativo Aplicable"
                  badge={countryNorms.general}
                />
                <select
                  value={formData.country}
                  onChange={(e) => {
                    const nextCountry = e.target.value;
                    setFormData({ ...formData, country: nextCountry });
                    setSelectedFramework(nextCountry);
                  }}
                  style={inputStyle}
                >
                  {countryList.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} — ({c.mainLaw})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <FieldLabel icon={<Mail size={14} />} label="Correo Electrónico Profesional" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="profesional@consultora.com"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <FieldLabel icon={<Phone size={14} />} label="Teléfono / WhatsApp" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+54 9 11 1234-5678"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <FieldLabel icon={<MapPin size={14} />} label="Dirección / Localidad Profesional" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ej: Av. Corrientes 1234, CABA, Argentina"
                  style={inputStyle}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  style={{
                    marginBottom: 0,
                    width: 'auto',
                    padding: '0.8rem 1.2rem',
                    borderRadius: '0.9rem',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    cursor: 'pointer'
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al Perfil
                </button>

                <button
                  type="submit"
                  style={{
                    marginBottom: 0,
                    flex: 1,
                    minWidth: '200px',
                    padding: '0.85rem 1.4rem',
                    borderRadius: '0.9rem',
                    background: saved
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    boxShadow: saved
                      ? '0 6px 18px rgba(16, 185, 129, 0.3)'
                      : '0 6px 18px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  {saved ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      ¡Datos Guardados!
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Guardar Datos Profesionales
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* RIGHT COLUMN (5 cols on desktop): Photo Upload & Live Credential Preview */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Photo Upload Card */}
          <div
            className="rounded-3xl p-4 sm:p-6 shadow-sm text-center"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)'
            }}
          >
            <span
              className="text-[11px] font-extrabold uppercase tracking-wider block mb-3"
              style={{ color: 'var(--color-text-light)' }}
            >
              Fotografía de Credencial Profesional
            </span>

            <div className="relative w-28 h-28 mx-auto mb-3">
              {formData.photo ? (
                <img
                  src={formData.photo}
                  alt="Foto de Perfil"
                  className="w-full h-full rounded-full object-cover shadow-lg"
                  style={{ border: '4px solid #2563eb' }}
                />
              ) : (
                <div
                  className="w-full h-full rounded-full flex items-center justify-center text-4xl font-black text-white shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                    border: '4px solid var(--color-background)'
                  }}
                >
                  {(formData.name || 'P').charAt(0).toUpperCase()}
                </div>
              )}

              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                style={{
                  marginBottom: 0,
                  width: '38px',
                  height: '38px',
                  padding: 0,
                  borderRadius: '50%',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: '3px solid var(--color-surface)',
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(37, 99, 235, 0.35)'
                }}
                title="Cambiar foto"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs m-0 mb-3" style={{ color: 'var(--color-text-light)' }}>
              Subí una foto formal para tu credencial digital y reportes ejecutivos.
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                style={{
                  marginBottom: 0,
                  width: 'auto',
                  padding: '0.5rem 0.95rem',
                  borderRadius: '0.75rem',
                  backgroundColor: 'rgba(37, 99, 235, 0.12)',
                  color: '#2563eb',
                  border: '1px solid rgba(37, 99, 235, 0.3)',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <Camera className="w-3.5 h-3.5" />
                {formData.photo ? 'Cambiar Foto' : 'Subir Foto'}
              </button>

              {formData.photo && (
                <button
                  type="button"
                  onClick={removePhoto}
                  style={{
                    marginBottom: 0,
                    width: 'auto',
                    padding: '0.5rem 0.85rem',
                    borderRadius: '0.75rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#dc2626',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Quitar
                </button>
              )}
            </div>
          </div>

          {/* Live Preview of PDF Signature Box */}
          <div
            className="rounded-3xl p-4 sm:p-6 shadow-sm text-left"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)'
            }}
          >
            <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-black" style={{ color: 'var(--color-text)' }}>
                  Vista Previa en Pie de Informe PDF
                </span>
              </div>
              <span
                className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.14)',
                  color: '#059669'
                }}
              >
                En Vivo
              </span>
            </div>

            {/* White Paper Simulation */}
            <div
              className="rounded-2xl p-4 border shadow-inner text-center"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#cbd5e1',
                color: '#0f172a'
              }}
            >
              <div
                className="mx-auto mb-2 border-b-2 border-dashed pb-2 max-w-[220px]"
                style={{ borderColor: '#94a3b8' }}
              >
                <span className="text-[11px] italic font-serif text-slate-400">
                  [Firma y Sello del Profesional]
                </span>
              </div>
              <div className="text-xs sm:text-sm font-black uppercase tracking-tight text-slate-900">
                {formData.name || 'Nombre del Profesional'}
              </div>
              <div className="text-[11px] font-bold text-blue-700 mt-0.5">
                {formData.profession || DEFAULT_PROFESSION}
              </div>
              <div className="text-[10px] font-mono font-bold text-slate-600 mt-0.5">
                Matrícula: {formData.license || 'S/D'}
                {formData.college ? ` · ${formData.college}` : ''}
              </div>
              {formData.dni && (
                <div className="text-[10px] text-slate-500">DNI / ID: {formData.dni}</div>
              )}
            </div>

            <div
              className="mt-4 p-3 rounded-2xl flex items-start gap-2.5"
              style={{
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                border: '1px solid rgba(37, 99, 235, 0.2)'
              }}
            >
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs m-0 leading-relaxed" style={{ color: 'var(--color-text)' }}>
                Estos datos también se utilizan para generar tu <strong>Sello Profesional Automático</strong> en la sección de Firma y Sello.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
