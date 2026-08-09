import { AuditLog } from './mongo.js';

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export class AuditLogger {
  public static async log(userId: string, action: string, details: string = '', ipAddress: string = '127.0.0.1'): Promise<void> {
    try {
      await new AuditLog({
        userId,
        action,
        details,
        ipAddress
      }).save();
      console.log(`[AuditLogger] 📜 [User #${userId}] ${action}: ${details}`);
    } catch (err: any) {
      console.error(`[AuditLogger] Error logging audit action: ${err.message}`);
    }
  }

  public static async getLogs(userId: string, limit: number = 50): Promise<AuditLogEntry[]> {
    try {
      const logs = await AuditLog.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
      return logs.map((log: any) => ({
        id: log._id.toString(),
        userId: log.userId.toString(),
        action: log.action,
        details: log.details,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt ? log.createdAt.toISOString() : new Date().toISOString()
      }));
    } catch (err: any) {
      console.error(`[AuditLogger] Error retrieving audit logs: ${err.message}`);
      return [];
    }
  }
}
