import { renderHook, act, waitFor } from '@testing-library/react';
import { usePaywall } from '../usePaywall';
import * as AuthContext from '../../contexts/AuthContext';
import * as SyncContext from '../../contexts/SyncContext';
import * as router from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

describe('usePaywall', () => {
    const mockNavigate = vi.fn();
    
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        vi.spyOn(router, 'useNavigate').mockReturnValue(mockNavigate);
        vi.spyOn(SyncContext, 'useSync').mockReturnValue({ syncPulse: 0 } as any);
    });

    const createMockUser = (email: string, isProClaim: boolean = false) => ({
        email,
        getIdTokenResult: vi.fn().mockResolvedValue({
            claims: { isPro: isProClaim }
        })
    });

    it('retorna isPro = false si no hay usuario', () => {
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ currentUser: null } as any);
        const { result } = renderHook(() => usePaywall());
        expect(result.current.isPro).toBe(false);
        expect(result.current.status).toBe('none');
    });

    it('retorna isPro = true y status = active si el usuario es ADMIN', async () => {
        const mockUser = createMockUser('enzorodriguez31@gmail.com', false);
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ currentUser: mockUser } as any);
        
        const { result } = renderHook(() => usePaywall());
        
        // ADMIN check is synchronous
        expect(result.current.isPro).toBe(true);
        expect(result.current.status).toBe('active');
        expect(result.current.daysRemaining).toBe(Infinity);
    });

    it('retorna isPro = true si el servidor devuelve claim de isPro', async () => {
        const mockUser = createMockUser('usuario@normal.com', true);
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ currentUser: mockUser } as any);

        const { result } = renderHook(() => usePaywall());
        
        // Inicialmente false porque el useEffect es asíncrono
        expect(result.current.isPro).toBe(false);

        await waitFor(() => {
            expect(result.current.isPro).toBe(true);
            expect(result.current.status).toBe('active');
        });
    });

    it('ignora suscripciones activas hackeadas en localStorage por seguridad', async () => {
        const mockUser = createMockUser('usuario@normal.com', false);
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ currentUser: mockUser } as any);

        const futureDate = Date.now() + 1000 * 60 * 60 * 24 * 5; // 5 días
        localStorage.setItem('subscriptionData', JSON.stringify({
            status: 'active',
            expiry: futureDate.toString()
        }));

        const { result } = renderHook(() => usePaywall());
        
        await waitFor(() => {
            expect(mockUser.getIdTokenResult).toHaveBeenCalled();
            // isPro debe ser false a pesar de localStorage
            expect(result.current.isPro).toBe(false);
        });
    });

    it('requirePro ejecuta la accion si es pro', async () => {
        const mockUser = createMockUser('enzorodriguez31@gmail.com', false);
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ currentUser: mockUser } as any);

        const { result } = renderHook(() => usePaywall());
        const mockAction = vi.fn();
        
        act(() => {
            result.current.requirePro(mockAction);
        });

        expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('requirePro bloquea la accion y muestra popup si no es pro', async () => {
        const mockUser = createMockUser('usuario@normal.com', false);
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ currentUser: mockUser } as any);
        
        const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

        const { result } = renderHook(() => usePaywall());
        const mockAction = vi.fn();
        
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => {
            result.current.requirePro(mockAction);
        });

        expect(mockAction).not.toHaveBeenCalled();
        expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
        const eventArgs = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
        expect(eventArgs.type).toBe('show-paywall');
    });
});
