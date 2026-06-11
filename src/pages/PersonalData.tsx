import React, { useState, useEffect } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, CreditCard, Award, Phone, MapPin, Camera, Trash2, GraduationCap, Globe, CheckCircle } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { countryList } from '../data/legislationData';
import toast from 'react-hot-toast';

const FieldGroup = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: '1.5rem' }}>
        <label style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.5px', color: 'var(--color-text-secondary)',
            marginBottom: '0.5rem'
        }}>
            <span style={{ color: 'var(--color-primary)' }}>{icon}</span> {label}
        </label>
        {children}
    </div>
);

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
                    height = Math.round((height * maxSize) / width);
                    width = maxSize;
                } else if (height > maxSize) {
                    width = Math.round((width * maxSize) / height);
                    height = maxSize;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setFormData(prev => ({ ...prev, photo: compressedDataUrl }));
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    };

    const removePhoto = () => {
        setFormData(prev => ({ ...prev, photo: null }));
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
        <div className="container animate-fade-in" style={{ maxWidth: '600px', paddingBottom: '4rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)}
                    style={{
                        padding: '0.6rem',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        color: 'var(--color-text)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'} className="btn-back-premium" title="Volver" aria-label="Volver atrás">
                            <ArrowLeft size={20}  />
                        </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Datos Personales</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Tu información profesional</p>
                </div>
            </div>

            {/* Photo Card */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(139, 92, 246, 0.08))',
                border: '1px solid var(--glass-border)',
                borderRadius: '24px',
                padding: '2rem',
                textAlign: 'center',
                marginBottom: '1.5rem',
                backdropFilter: 'blur(12px)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)',
                    width: '120px', height: '120px',
                    background: 'rgba(56, 189, 248, 0.12)', filter: 'blur(35px)', borderRadius: '50%', zIndex: 0
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.2rem' }}>
                        {formData.photo ? (
                            <img
                                src={formData.photo}
                                alt="Profile"
                                style={{
                                    width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover',
                                    border: '4px solid var(--color-surface)',
                                    outline: '2px solid rgba(56, 189, 248, 0.4)',
                                    boxShadow: '0 10px 25px rgba(56, 189, 248, 0.2)'
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '100%', height: '100%', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '2.5rem', color: 'white', fontWeight: 900,
                                border: '4px solid var(--color-surface)',
                                outline: '2px solid rgba(56, 189, 248, 0.3)',
                                boxShadow: '0 10px 25px rgba(56, 189, 248, 0.25)'
                            }}>
                                {(formData.name || 'U').charAt(0)}
                            </div>
                        )}
                        <label
                            htmlFor="photo-upload"
                            style={{
                                position: 'absolute', bottom: '0', right: '0',
                                background: 'linear-gradient(135deg, #38bdf8, #3b82f6)',
                                color: '#ffffff',
                                width: '38px', height: '38px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', boxShadow: '0 4px 12px rgba(56, 189, 248, 0.4)',
                                border: '3px solid var(--color-surface)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Camera size={16} />
                            <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                        </label>
                        {formData.photo && (
                            <button
                                onClick={removePhoto}
                                style={{
                                    position: 'absolute', top: '0', right: '0',
                                    background: '#ef4444', color: '#ffffff',
                                    padding: '4px', borderRadius: '50%', border: '3px solid var(--color-surface)',
                                    cursor: 'pointer', width: '28px', height: '28px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                                }}
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0, fontWeight: 500 }}>
                        Tocá la cámara para cambiar tu foto
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <div style={{
                background: 'rgba(var(--color-surface-rgb), 0.5)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '24px',
                padding: '2rem'
            }}>
                <FieldGroup icon={<User size={15} />} label="Nombre y Apellido">
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
                </FieldGroup>

                <FieldGroup icon={<GraduationCap size={15} />} label="Título / Profesión">
                    <select
                        value={formData.profession}
                        onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                        style={{ ...inputStyle, appearance: 'none' }}
                    >
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
                        style={{ ...inputStyle, appearance: 'none' }}
                    >
                        {countryList.map(c => (
                            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                        ))}
                    </select>
                </FieldGroup>

                <FieldGroup icon={<Mail size={15} />} label="Email">
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={inputStyle} />
                </FieldGroup>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <FieldGroup icon={<CreditCard size={15} />} label="DNI / Cédula">
                        <input type="text" value={formData.dni} onChange={(e) => setFormData({ ...formData, dni: e.target.value })} style={inputStyle} />
                    </FieldGroup>
                    <FieldGroup icon={<Award size={15} />} label="Matrícula">
                        <input type="text" value={formData.license} onChange={(e) => setFormData({ ...formData, license: e.target.value })} style={inputStyle} />
                    </FieldGroup>
                </div>

                <FieldGroup icon={<Phone size={15} />} label="Teléfono">
                    <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={inputStyle} />
                </FieldGroup>

                <FieldGroup icon={<MapPin size={15} />} label="Dirección Profesional">
                    <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} style={inputStyle} />
                </FieldGroup>

                <button
                    onClick={(e) => { e.preventDefault(); requirePro(handleSave); }}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                        marginTop: '0.5rem', padding: '1.1rem', width: '100%',
                        background: saved ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #38bdf8, #3b82f6)',
                        color: 'white', border: 'none', borderRadius: '16px',
                        fontSize: '1.05rem', fontWeight: 800, cursor: 'pointer',
                        boxShadow: saved ? '0 8px 20px rgba(16, 185, 129, 0.3)' : '0 8px 20px rgba(56, 189, 248, 0.3)',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                >
                    {saved ? <><CheckCircle size={20} /> ¡Guardado!</> : <><Save size={20} /> Guardar Cambios</>}
                </button>
            </div>
        </div>
    );
}
