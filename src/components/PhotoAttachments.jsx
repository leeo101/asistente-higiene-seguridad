import React, { useState, useRef } from 'react';
import { Camera, Image, Trash2, ZoomIn, X } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * PhotoAttachments — reutilizable en cualquier módulo.
 * Props:
 *   photos: string[]   — array de dataURLs
 *   onChange: fn       — recibe el nuevo array de dataURLs
 *   maxPhotos: number  — default 5
 *   label: string      — encabezado de sección
 */
export default function PhotoAttachments({ photos = [], onChange, maxPhotos = 5, label = 'Fotos de Evidencia' }) {
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(null); // lightbox

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        if (photos.length + files.length > maxPhotos) {
            toast.error(`Máximo ${maxPhotos} fotos por registro.`);
            return;
        }

        const readers = files.map(file => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = ev => resolve(ev.target.result);
            reader.readAsDataURL(file);
        }));

        Promise.all(readers).then(newDataUrls => {
            onChange([...photos, ...newDataUrls]);
        });

        // reset input so same file can be selected again
        e.target.value = '';
    };

    const removePhoto = (idx) => {
        const updated = photos.filter((_, i) => i !== idx);
        onChange(updated);
    };

    return (
        <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Camera size={15} /> {label}
                    {photos.length > 0 && (
                        <span style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)', padding: '0.1rem 0.5rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800 }}>
                            {photos.length}/{maxPhotos}
                        </span>
                    )}
                </label>
                {photos.length < maxPhotos && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
                            borderRadius: '8px', padding: '0.35rem 0.75rem',
                            color: 'var(--color-primary)', cursor: 'pointer',
                            fontSize: '0.78rem', fontWeight: 700
                        }}
                    >
                        <Image size={14} /> Agregar foto
                    </button>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    hidden
                    onChange={handleFileSelect}
                />
            </div>

            {photos.length === 0 ? (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        width: '100%', padding: '1.5rem', border: '2px dashed var(--color-border)',
                        borderRadius: '12px', background: 'transparent', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                        color: 'var(--color-text-muted)', transition: 'border-color 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                >
                    <Camera size={24} style={{ opacity: 0.4 }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Tocá para adjuntar fotos de evidencia</span>
                    <span style={{ fontSize: '0.72rem' }}>JPG, PNG — máx. {maxPhotos} fotos</span>
                </button>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.6rem' }}>
                    {photos.map((src, idx) => (
                        <div
                            key={idx}
                            style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '1' }}
                        >
                            <img
                                src={src}
                                alt={`Foto ${idx + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                                onClick={() => setPreview(src)}
                            />
                            {/* Action overlay — shown on hover (desktop) or always (touch via CSS) */}
                            <div
                                className="photo-overlay"
                                style={{
                                    position: 'absolute', inset: 0,
                                    background: 'rgba(0,0,0,0.4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: '0.5rem', opacity: 0, transition: 'opacity 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.opacity = '1'}
                                onMouseOut={e => e.currentTarget.style.opacity = '0'}
                            >
                                <button
                                    type="button"
                                    onClick={() => setPreview(src)}
                                    style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                >
                                    <ZoomIn size={15} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removePhoto(idx)}
                                    style={{ background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {photos.length < maxPhotos && (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                aspectRatio: '1', borderRadius: '10px', border: '2px dashed var(--color-border)',
                                background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                                color: 'var(--color-text-muted)', transition: 'border-color 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                        >
                            <Camera size={18} style={{ opacity: 0.5 }} />
                            <span style={{ fontSize: '0.6rem', fontWeight: 700 }}>Agregar</span>
                        </button>
                    )}
                </div>
            )}

            {/* Lightbox */}
            {preview && (
                <div
                    onClick={() => setPreview(null)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '1.5rem', animation: 'fadeIn 0.2s ease'
                    }}
                >
                    <button
                        onClick={() => setPreview(null)}
                        style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                    >
                        <X size={20} />
                    </button>
                    <img
                        src={preview}
                        alt="Vista previa"
                        style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
