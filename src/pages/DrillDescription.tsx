import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function DrillDescription() {
    const navigate = useNavigate();
    return (
        <div style={{ padding: '2rem' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <ArrowLeft /> Volver
            </button>
            <h1>Descripción del Simulacro</h1>
            <p>Aquí se detallará la descripción del simulacro realizado.</p>
        </div>
    );
}
