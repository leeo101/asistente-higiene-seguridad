import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Hash, Mail, Phone, MapPin, Upload } from 'lucide-react';

export default function PersonalData() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: 'Lic. Juan Pérez',
        profession: 'Licenciado en Higiene y Seguridad',
        license: '5542',
        dni: '20-12345678-9',
        photo: null,
        email: 'juan.perez@seguridad.com',
        phone: '+54 11 1234-5678',
        address: 'Calle Falsa 123, CABA',
        professionalAddress: 'Av. Corrientes 1234, CABA'
    });

    useEffect(() => {
        const savedData = localStorage.getItem('personalData');
        if (savedData) {
            setFormData(JSON.parse(savedData));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        localStorage.setItem('personalData', JSON.stringify(formData));
        alert('Datos guardados correctamente');
        navigate('/profile');
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Datos Personales</h1>
            </div>

            <form onSubmit={handleSave}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            border: '2px solid var(--color-primary)',
                            overflow: 'hidden',
                            background: 'var(--color-surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {formData.photo ? (
                                <img src={formData.photo} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <User size={50} color="var(--color-text-muted)" />
                            )}
                        </div>
                        <label style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            background: 'var(--color-primary)',
                            borderRadius: '50%',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                            <Upload size={16} color="white" />
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            setFormData(prev => ({ ...prev, photo: event.target.result }));
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        </label>
                    </div>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Tocar para subir foto</p>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                            <User size={18} color="var(--color-primary)" /> Nombre Completo
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ej: Juan Pérez"
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                            <User size={18} color="var(--color-primary)" /> Profesión
                        </label>
                        <input
                            list="profesiones-lista"
                            name="profession"
                            value={formData.profession}
                            onChange={handleChange}
                            placeholder="Ej: Licenciado, Técnico..."
                        />
                        <datalist id="profesiones-lista">
                            <option value="Licenciado en Higiene y Seguridad" />
                            <option value="Técnico en Higiene y Seguridad" />
                            <option value="Técnico Superior en Higiene y Seguridad" />
                            <option value="Ingeniero con Especialidad" />
                        </datalist>
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                            <Hash size={18} color="var(--color-primary)" /> Matrícula / Registro
                        </label>
                        <input
                            type="text"
                            name="license"
                            value={formData.license}
                            onChange={handleChange}
                            placeholder="Ej: 5542"
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                            <Hash size={18} color="var(--color-primary)" /> DNI / CUIL
                        </label>
                        <input
                            type="text"
                            name="dni"
                            value={formData.dni}
                            onChange={handleChange}
                            placeholder="Ej: 20-12345678-9"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                            <Mail size={18} color="var(--color-primary)" /> Correo Electrónico
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="juan.perez@ejemplo.com"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                            <Phone size={18} color="var(--color-primary)" /> Teléfono
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+54 11 ..."
                        />
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                            <MapPin size={18} color="var(--color-primary)" /> Dirección
                        </label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Calle, Ciudad, Provincia"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                            <MapPin size={18} color="var(--color-primary)" /> Dirección Profesional (Matriculación)
                        </label>
                        <input
                            type="text"
                            name="professionalAddress"
                            value={formData.professionalAddress}
                            onChange={handleChange}
                            placeholder="Donde está matriculado el profesional"
                        />
                    </div>
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                    <Save size={20} /> Guardar Cambios
                </button>
            </form>
        </div>
    );
}
