import React, { useState, useEffect } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, CreditCard, Award, Phone, MapPin, Camera, Trash2, GraduationCap, Globe, CheckCircle } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { countryList } from '../data/legislationData';
import toast from 'react-hot-toast';

const FieldGroup = ({ icon, label, children }: {icon: React.ReactNode;label: string;children: React.ReactNode;}) =>
<div className="mb-6">
        <label className="flex items-center gap-[0.5rem] text-[0.8rem] font-[800] uppercase letter-spacing-[0.5px] text-[var(--color-text-secondary)] mb-[0.5rem]">




    
            <span className="text-[var(--color-primary)]">{icon}</span> {label}
        </label>
        {children}
    </div>;


export default function PersonalData(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const { syncDocument } = useSync();
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Juan Pérez',
    email: 'juan.perez@seguridad.com',
    dni: '20.123.456',
    license: 'MP 5567',
    phone: '+54 9 11 1234-5678',
    address: 'Av. Corrientes 1234, CABA',
    country: 'argentina',
    photo: null,
    profession: ''
  });

  useEffect(() => {
    const savedData = localStorage.getItem('personalData');
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, []);

  const handleSave = async () => {
    await syncDocument('personalData', formData);
    setSaved(true);
    toast.success('Datos guardados correctamente');
    setTimeout(() => {
      setSaved(false);
      navigate('/profile');
    }, 800);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxSize = 800;
        if (width > height && width > maxSize) {
          height = Math.round(height * maxSize / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round(width * maxSize / height);
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFormData((prev) => ({ ...prev, photo: compressedDataUrl }));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, photo: null }));
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.85rem 1rem',
    background: 'var(--color-background)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    color: 'var(--color-text)',
    fontSize: '0.95rem',
    fontWeight: 500,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  };

  return (
    <div className="container animate-fade-in max-w-[600px] pb-[4rem]">
            {/* Header */}
            <div className="flex items-center gap-[1rem] mb-[2rem]">
                <></>
                <div>
                    <h1 className="m-[0] text-[1.6rem] font-[900] letter-spacing-[-0.5px]">Datos Personales</h1>
                    <p className="m-[0] text-[0.85rem] text-[var(--color-text-secondary)]">Tu información profesional</p>
                </div>
            </div>

            {/* Photo Card */}
            <div className="bg-[linear-gradient(135deg,_rgba(56,_189,_248,_0.08),_rgba(139,_92,_246,_0.08))] border-[1px_solid_var(--glass-border)] rounded-[24px] p-[2rem] text-center mb-[1.5rem] backdrop-filter-[blur(12px)] relative overflow-[hidden]">









        
                <div className="absolute top-[-30px] left-[50%] transform-[translateX(-50%)] w-[120px] h-[120px] bg-[rgba(56,_189,_248,_0.12)] filter-[blur(35px)] rounded-[50%] z-[0]" />



        
                <div className="relative z-[1]">
                    <div className="relative w-[120px] h-[120px] m-[0_auto_1.2rem]">
                        {formData.photo ?
            <img
              src={formData.photo}
              alt="Profile" className="w-[100%] h-[100%] rounded-[50%] object-fit-[cover] border-[4px_solid_var(--color-surface)] outline-[2px_solid_rgba(56,_189,_248,_0.4)] box-shadow-[0_10px_25px_rgba(56,_189,_248,_0.2)]" /> :








            <div className="w-[100%] h-[100%] rounded-[50%] bg-[linear-gradient(135deg,_#38bdf8_0%,_#3b82f6_100%)] flex items-center justify-center text-[2.5rem] text-[white] font-[900] border-[4px_solid_var(--color-surface)] outline-[2px_solid_rgba(56,_189,_248,_0.3)] box-shadow-[0_10px_25px_rgba(56,_189,_248,_0.25)]">







              
                                {(formData.name || 'U').charAt(0)}
                            </div>
            }
                        <label
              htmlFor="photo-upload"










              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} className="absolute bottom-[0] right-[0] bg-[linear-gradient(135deg,_#38bdf8,_#3b82f6)] text-[#ffffff] w-[38px] h-[38px] rounded-[50%] flex items-center justify-center cursor-pointer box-shadow-[0_4px_12px_rgba(56,_189,_248,_0.4)] border-[3px_solid_var(--color-surface)] transition-[transform_0.2s]">
              
                            <Camera size={16} />
                            <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="none" />
                        </label>
                        {formData.photo &&
            <button
              onClick={removePhoto} className="absolute top-[0] right-[0] bg-[#ef4444] text-[#ffffff] p-[4px] rounded-[50%] border-[3px_solid_var(--color-surface)] cursor-pointer w-[28px] h-[28px] flex items-center justify-center box-shadow-[0_2px_8px_rgba(239,_68,_68,_0.3)]">








              
                                <Trash2 size={12} />
                            </button>
            }
                    </div>
                    <p className="text-[0.85rem] text-[var(--color-text-secondary)] m-[0] font-[500]">
                        Tocá la cámara para cambiar tu foto
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-[rgba(var(--color-surface-rgb),_0.5)] backdrop-filter-[blur(12px)] border-[1px_solid_var(--glass-border)] rounded-[24px] p-[2rem]">





        
                <FieldGroup icon={<User size={15} />} label="Nombre y Apellido">
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                </FieldGroup>

                <FieldGroup icon={<GraduationCap size={15} />} label="Título / Profesión">
                    <select
            value={formData.profession}
            onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
            style={{ ...inputStyle }} className="appearance-[none]">
            
                        <option value="">Seleccione su título</option>
                        <option value="Técnico">Técnico</option>
                        <option value="Ingeniero">Ingeniero</option>
                        <option value="Licenciado">Licenciado</option>
                    </select>
                </FieldGroup>

                <FieldGroup icon={<Globe size={15} />} label="País / Región">
                    <select
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            style={{ ...inputStyle }} className="appearance-[none]">
            
                        {countryList.map((c) =>
            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            )}
                    </select>
                </FieldGroup>

                <FieldGroup icon={<Mail size={15} />} label="Email">
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                </FieldGroup>

                <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem]">
                    <FieldGroup icon={<CreditCard size={15} />} label="DNI / Cédula">
                        <input type="text" value={formData.dni} onChange={(e) => setFormData({ ...formData, dni: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                    </FieldGroup>
                    <FieldGroup icon={<Award size={15} />} label="Matrícula">
                        <input type="text" value={formData.license} onChange={(e) => setFormData({ ...formData, license: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                    </FieldGroup>
                </div>

                <FieldGroup icon={<Phone size={15} />} label="Teléfono">
                    <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                </FieldGroup>

                <FieldGroup icon={<MapPin size={15} />} label="Dirección Profesional">
                    <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                </FieldGroup>

                <button
          onClick={(e) => {e.preventDefault();requirePro(handleSave);}}
          style={{


            background: saved ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #38bdf8, #3b82f6)',


            boxShadow: saved ? '0 8px 20px rgba(16, 185, 129, 0.3)' : '0 8px 20px rgba(56, 189, 248, 0.3)'

          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'none'} className="flex items-center justify-center gap-[0.6rem] mt-[0.5rem] p-[1.1rem] w-[100%] text-[white] border-none rounded-[16px] text-[1.05rem] font-[800] cursor-pointer transition-[all_0.3s_ease]">
          
                    {saved ? <><CheckCircle size={20} /> ¡Guardado!</> : <><Save size={20} /> Guardar Cambios</>}
                </button>
            </div>
        </div>);

}