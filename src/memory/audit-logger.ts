import { db } from './db.js';

export interface AuditLogEntry {
  id: number;
  user_id: number;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export class AuditLogger {
  public static log(userId: number, action: string, details: string = '', ipAddress: string = '127.0.0.1'): void {
    try {
      db.prepare(`
        INSERT INTO audit_logs (user_id, action, details, ip_address)
        VALUES (?, ?, ?, ?)
      `).run(userId, action, details, ipAddress);
      console.log(`[AuditLogger] 📜 [User #${userId}] ${action}: ${details}`);
    } catch (err: any) {
      console.error(`[AuditLogger] Error logging audit action: ${err.message}`);
    }
  }

  public static getLogs(userId: number = 1, limit: number = 50): AuditLogEntry[] {
    try {
      return db.prepare(`
        SELECT * FROM audit_logs
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ?
      `).all(userId, limit) as AuditLogEntry[];
    } catch (err: any) {
      console.error(`[AuditLogger] Error retrieving audit logs: ${err.message}`);
      return [];
    }
  }
}
