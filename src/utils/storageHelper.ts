export function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value !== 'string') return value as T;
  // Si comienza con data: o http, es un asset/imagen, no JSON
  const trimmed = value.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('http:') || trimmed.startsWith('https:')) {
    return fallback;
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return fallback;
  }
}

export function safeGetLocalStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return safeJsonParse(raw, fallback);
  } catch {
    return fallback;
  }
}

export const safeSetLocalStorage = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`LocalStorage quota exceeded writing '${key}'. Starting cleanup...`, e);
    try {
      // 1. Limpiar reportes pesados de IA y claves temporales
      const keysToRemove: string[] = [];
      const checklistKeys: { key: string; time: number }[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;

        if (
          k.startsWith('ai_report_full_') ||
          k.startsWith('temp_') ||
          k.startsWith('draft_') ||
          k.startsWith('cache_')
        ) {
          keysToRemove.push(k);
        } else if (k.startsWith('checklist_') && k !== key && k !== 'checklist_tutorial_seen') {
          const tsPart = k.replace('checklist_', '');
          const parsedTs = parseInt(tsPart, 10);
          checklistKeys.push({
            key: k,
            time: isNaN(parsedTs) ? 0 : parsedTs,
          });
        }
      }

      keysToRemove.forEach((k) => {
        try { localStorage.removeItem(k); } catch {}
      });

      // Si hay más de 5 checklists individuales, eliminar los más antiguos
      if (checklistKeys.length > 5) {
        checklistKeys.sort((a, b) => a.time - b.time);
        const excess = checklistKeys.slice(0, checklistKeys.length - 5);
        excess.forEach((item) => {
          try { localStorage.removeItem(item.key); } catch {}
        });
      }

      // Reintentar guardar
      localStorage.setItem(key, value);
      return true;
    } catch (e2) {
      console.warn(`LocalStorage still full for '${key}'. Stripping media/deep pruning...`, e2);
      try {
        // 2. Si todavía falla y el valor es JSON, intentar guardar versión liviana sin base64 pesado
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object') {
          if (parsed.fotos) parsed.fotos = [];
          if (Array.isArray(parsed.activeSections)) {
            parsed.activeSections.forEach((s: any) => {
              if (Array.isArray(s.items)) {
                s.items.forEach((it: any) => {
                  if (it.photos) it.photos = [];
                });
              }
            });
          }
          if (Array.isArray(parsed)) {
            const trimmed = parsed.slice(0, 20).map((h: any) => {
              if (typeof h === 'object' && h !== null) {
                return { ...h, fotos: [] };
              }
              return h;
            });
            localStorage.setItem(key, JSON.stringify(trimmed));
            return true;
          }

          localStorage.setItem(key, JSON.stringify(parsed));
          return true;
        }
      } catch (stripErr) {
        console.warn(`Could not save stripped version for '${key}':`, stripErr);
      }

      // 3. Si aún falla, asegurar que al menos no lance una excepción no capturada
      return false;
    }
  }
};
