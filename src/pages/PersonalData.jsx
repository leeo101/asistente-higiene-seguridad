import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, CreditCard, Award, Phone, MapPin, Camera, Trash2, GraduationCap } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';

export default function PersonalData() {
    const navigate = useNavigate();
    const { syncDocument } = useSync();
    const [formData, setFormData] = useState({
        name: 'Juan Pérez',
        email: 'juan.perez@seguridad.com',
        dni: '20.123.456',
        license: 'MP 5567',
        phone: '+54 9 11 1234-5678',
        address: 'Av. Corrientes 1234, CABA',
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
        alert('Datos guardados correctamente');
        navigate('/profile');
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 1024 * 1024) { // 1MB limit for localStorage
                alert('La foto es demasiado grande. Por favor elige una de menos de 1MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = () => {
        setFormData(prev => ({ ...prev, photo: null }));
    };

    return (
        <div className="container" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Mis Datos Personales</h1>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem' }}>
                    {formData.photo ? (
                        <img
                            src={formData.photo}
                            alt="Profile"
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-primary)' }}
                        />
                    ) : (
                        <img
                            src="/logo.png"
                            alt="Default Logo"
                            style={{ width: '80%', height: '80%', borderRadius: '0', objectFit: 'contain' }}
                        />
                    )}
                    <label
                        htmlFor="photo-upload"
                        style={{
                            position: 'absolute',
                            bottom: '0',
                            right: '0',
                            background: 'var(--color-primary)',
                            color: 'white',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                            marginBottom: 0
                        }}
                    >
                        <Camera size={18} />
                        <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                    </label>
                    {formData.photo && (
                        <button
                            onClick={removePhoto}
                            style={{
                                position: 'absolute',
                                top: '0',
                                right: '0',
                                background: '#ef4444',
                                color: 'white',
                                padding: '4px',
                                borderRadius: '50%',
                                border: 'none',
                                cursor: 'pointer',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Trash2 size={12} />
                        </button>
                    )}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>Haz clic en la cámara para subir tu foto</p>
            </div>

            <div className="card">
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={16} color="var(--color-primary)" /> Nombre y Apellido
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <GraduationCap size={16} color="var(--color-primary)" /> Título / Profesión
                    </label>
                    <select
                        value={formData.profession}
                        onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'white' }}
                    >
                        <option value="">Seleccione su título</option>
                        <option value="Técnico">Técnico</option>
                        <option value="Ingeniero">Ingeniero</option>
                        <option value="Licenciado">Licenciado</option>
                    </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={16} color="var(--color-primary)" /> Email
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                <div className="grid-res-2">
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CreditCard size={16} color="var(--color-primary)" /> DNI
                        </label>
                        <input
                            type="text"
                            value={formData.dni}
                            onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                        />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Award size={16} color="var(--color-primary)" /> Matrícula Profesional
                        </label>
                        <input
                            type="text"
                            value={formData.license}
                            onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={16} color="var(--color-primary)" /> Teléfono
                    </label>
                    <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={16} color="var(--color-primary)" /> Dirección Profesional
                    </label>
                    <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                </div>

                <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl border-0 shadow-sm transition-all font-bold" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', padding: '1rem', width: '100%' }}>
                    <Save size={18} /> Guardar Cambios
                </button>
            </div>
        </div>
    );
}
