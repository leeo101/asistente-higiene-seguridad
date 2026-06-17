import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from '../ConfirmModal';
import '@testing-library/jest-dom';

describe('ConfirmModal', () => {
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('no renderiza nada si isOpen es false', () => {
        render(
            <ConfirmModal 
                isOpen={false} 
                onClose={mockOnClose} 
                onConfirm={mockOnConfirm} 
            />
        );
        expect(screen.queryByText('¿Estás seguro?')).not.toBeInTheDocument();
    });

    it('renderiza correctamente cuando isOpen es true', () => {
        render(
            <ConfirmModal 
                isOpen={true} 
                onClose={mockOnClose} 
                onConfirm={mockOnConfirm} 
                title="Atención"
                message="Mensaje de prueba"
            />
        );
        expect(screen.getByText('Atención')).toBeInTheDocument();
        expect(screen.getByText('Mensaje de prueba')).toBeInTheDocument();
        expect(screen.getByText('Confirmar')).toBeInTheDocument();
        expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('llama a onConfirm cuando se hace click en el botón confirmar', () => {
        render(
            <ConfirmModal 
                isOpen={true} 
                onClose={mockOnClose} 
                onConfirm={mockOnConfirm} 
                confirmText="Sí, borrar"
            />
        );
        
        fireEvent.click(screen.getByText('Sí, borrar'));
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('llama a onClose cuando se hace click en cancelar', () => {
        render(
            <ConfirmModal 
                isOpen={true} 
                onClose={mockOnClose} 
                onConfirm={mockOnConfirm} 
            />
        );
        
        fireEvent.click(screen.getByText('Cancelar'));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnConfirm).not.toHaveBeenCalled();
    });
});
