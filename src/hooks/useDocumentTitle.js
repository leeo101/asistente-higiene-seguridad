import { useEffect } from 'react';

/**
 * Updates document.title dynamically on each page.
 * Falls back to the app name if no title is provided.
 * Usage: useDocumentTitle('Carga de Fuego');
 */
export function useDocumentTitle(title) {
    useEffect(() => {
        const base = 'Asistente HYS';
        document.title = title ? `${title} | ${base}` : base;
        return () => {
            document.title = base;
        };
    }, [title]);
}
