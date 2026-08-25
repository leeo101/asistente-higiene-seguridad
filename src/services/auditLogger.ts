export interface AuditLogEvent {
  id: string;
  timestamp: string;
  userId: string;
  userEmail?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT_PDF' | 'EXPORT_EXCEL' | 'SIGN' | 'INSPECT';
  module: string;
  details: string;
  ipAddress?: string;
  complianceTag?: string; // e.g. "ISO 45001 - 8.1.2", "OSHA 1910.1200"
}

const STORAGE_KEY = 'ehs_audit_logs';

export const logAuditEvent = (
  action: AuditLogEvent['action'],
  module: string,
  details: string,
  complianceTag?: string
): AuditLogEvent => {
  const newEvent: AuditLogEvent = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    userId: localStorage.getItem('ehs_user_id') || 'usr_anonymous',
    userEmail: localStorage.getItem('ehs_user_email') || 'inspector@empresa.com',
    action,
    module,
    details,
    ipAddress: '127.0.0.1 (Local Client)',
    complianceTag: complianceTag || 'ISO 45001 / OSHA Compliance'
  };

  try {
    const existing = getAuditLogs();
    const updated = [newEvent, ...existing].slice(0, 500); // Keep latest 500 logs locally
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('[AUDIT_LOGGER] Error storing audit log:', e);
  }

  return newEvent;
};

export const getAuditLogs = (): AuditLogEvent[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('[AUDIT_LOGGER] Error reading audit logs:', e);
    return [];
  }
};

export const clearAuditLogs = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
