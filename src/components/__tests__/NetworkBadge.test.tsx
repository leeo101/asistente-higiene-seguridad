import React from 'react';
import { render, screen, act } from '@testing-library/react';
import NetworkBadge from '../NetworkBadge';
import * as useNetworkStatusHook from '../../hooks/useNetworkStatus';
import '@testing-library/jest-dom';

describe('NetworkBadge', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('no renderiza nada cuando está online inicialmente', () => {
        vi.spyOn(useNetworkStatusHook, 'useNetworkStatus').mockReturnValue(true);
        const { container } = render(<NetworkBadge />);
        expect(container).toBeEmptyDOMElement();
    });

    it('muestra alerta offline cuando se pierde conexión', () => {
        vi.spyOn(useNetworkStatusHook, 'useNetworkStatus').mockReturnValue(false);
        render(<NetworkBadge />);
        expect(screen.getByText('Sin conexión - Guardado local activo')).toBeInTheDocument();
    });

    it('muestra mensaje de conexión restaurada temporalmente cuando vuelve a conectarse', () => {
        const mockHook = vi.spyOn(useNetworkStatusHook, 'useNetworkStatus');
        
        // Empezamos desconectados
        mockHook.mockReturnValue(false);
        const { rerender } = render(<NetworkBadge />);
        expect(screen.getByText('Sin conexión - Guardado local activo')).toBeInTheDocument();

        // Volvemos a conectarnos
        mockHook.mockReturnValue(true);
        rerender(<NetworkBadge />);
        expect(screen.getByText('✅ Conexión restaurada')).toBeInTheDocument();

        // Tras 3 segundos el badge debe desaparecer
        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(screen.queryByText('✅ Conexión restaurada')).not.toBeInTheDocument();
    });
});
