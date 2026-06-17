/**
 * Utilidades de manejo de errores con TypeScript estricto.
 *
 * Con `useUnknownInCatchVariables`, los errores en bloques catch
 * son `unknown` y no `any`. Estas helpers permiten accederlos de forma segura.
 */

/**
 * Extrae el mensaje de un error desconocido de forma segura.
 * @example
 * try { ... } catch (e) { toast.error(getErrorMessage(e)); }
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  ) {
    return (error as Record<string, unknown>).message as string;
  }
  return 'Error desconocido';
}

/**
 * Extrae el código de error de Firebase de forma segura.
 * @example
 * try { ... } catch (e) { if (getErrorCode(e) === 'auth/weak-password') ... }
 */
export function getErrorCode(error: unknown): string | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  ) {
    return (error as Record<string, unknown>).code as string;
  }
  return undefined;
}

/**
 * Verifica si un valor es una instancia de Error.
 * Útil como type guard en bloques catch.
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}
