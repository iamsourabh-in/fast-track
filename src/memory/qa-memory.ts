import { db } from './db.js';

export interface QARecord {
  id: number;
  question_normalized: string;
  question_raw: string;
  answer: string;
  confidence: number;
  usage_count: number;
}

export class QAMemoryEngine {
  private static normalizeQuestion(q: string): string {
    return q
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Look up if a question has been answered before in memory.
   */
  public static findAnswer(questionRaw: string, userId: number = 1): QARecord | null {
    const normalized = this.normalizeQuestion(questionRaw);
    
    // 1. Direct exact match on normalized string for user_id
    const exact = db.prepare('SELECT * FROM qa_memory WHERE user_id = ? AND question_normalized = ?').get(userId, normalized) as QARecord | undefined;
    if (exact) {
      db.prepare('UPDATE qa_memory SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(exact.id);
      return exact;
    }

    // 2. Fuzzy / Containment match with Category Safety for user_id
    const all = db.prepare('SELECT * FROM qa_memory WHERE user_id = ?').all(userId) as QARecord[];
    for (const record of all) {
      const isEmailPhoneQuery = normalized.includes('email') || normalized.includes('phone') || normalized.includes('mobile');
      const isEmailPhoneRecord = record.question_normalized.includes('email') || record.question_normalized.includes('phone') || record.question_normalized.includes('mobile');

      if (isEmailPhoneQuery !== isEmailPhoneRecord) {
        continue;
      }

      const sim = this.calculateSimilarity(normalized, record.question_normalized);
      const isSub = normalized.includes(record.question_normalized) || record.question_normalized.includes(normalized);
      const sharesKeyWords = this.sharesKeyTokens(normalized, record.question_normalized);

      if (sim >= 0.6 || isSub || sharesKeyWords) {
        db.prepare('UPDATE qa_memory SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(record.id);
        return record;
      }
    }

    return null;
  }

  private static sharesKeyTokens(s1: string, s2: string): boolean {
    const stopWords = new Set(['do', 'you', 'have', 'how', 'many', 'of', 'with', 'the', 'a', 'an', 'in', 'for', 'is', 'are', 'to']);
    const tokens1 = s1.split(' ').filter(w => w.length > 2 && !stopWords.has(w));
    const tokens2 = s2.split(' ').filter(w => w.length > 2 && !stopWords.has(w));
    if (tokens1.length === 0 || tokens2.length === 0) return false;
    const matchCount = tokens1.filter(t => tokens2.includes(t)).length;
    return (matchCount / Math.min(tokens1.length, tokens2.length)) >= 0.8;
  }

  /**
   * Save a new answered question into memory cache.
   */
  public static saveAnswer(questionRaw: string, answer: string, confidence: number = 1.0, userId: number = 1): QARecord {
    const normalized = this.normalizeQuestion(questionRaw);
    const safeAnswer = (answer !== undefined && answer !== null ? String(answer) : '').trim() || 'N/A';
    
    const existing = db.prepare('SELECT id FROM qa_memory WHERE user_id = ? AND question_normalized = ?').get(userId, normalized) as { id: number } | undefined;

    if (existing) {
      db.prepare(`
        UPDATE qa_memory SET
          answer = ?, confidence = ?, usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(safeAnswer, confidence, existing.id);
    } else {
      db.prepare(`
        INSERT INTO qa_memory (user_id, question_normalized, question_raw, answer, confidence, usage_count)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(userId, normalized, questionRaw, safeAnswer, confidence);
    }

    return db.prepare('SELECT * FROM qa_memory WHERE user_id = ? AND question_normalized = ?').get(userId, normalized) as QARecord;
  }

  public static getAllMemories(userId: number = 1): QARecord[] {
    return db.prepare('SELECT * FROM qa_memory WHERE user_id = ? ORDER BY usage_count DESC, updated_at DESC').all(userId) as QARecord[];
  }

  public static updateMemory(id: number, answer: string, userId: number = 1): boolean {
    const safeAnswer = (answer ?? '').trim() || 'N/A';
    const result = db.prepare('UPDATE qa_memory SET answer = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?').run(safeAnswer, id, userId);
    return result.changes > 0;
  }

  public static deleteMemory(id: number, userId: number = 1): boolean {
    const result = db.prepare('DELETE FROM qa_memory WHERE id = ? AND user_id = ?').run(id, userId);
    return result.changes > 0;
  }

  public static clearAllMemories(userId: number = 1): void {
    db.prepare('DELETE FROM qa_memory WHERE user_id = ?').run(userId);
    console.log(`[QAMemoryEngine] Cleared all cached memories for user #${userId}.`);
  }

  public static getStats(userId: number = 1): { totalAnswers: number; totalReuses: number } {
    const row = db.prepare('SELECT COUNT(*) as total, SUM(usage_count) as reuses FROM qa_memory WHERE user_id = ?').get(userId) as { total: number; reuses: number | null };
    return {
      totalAnswers: row.total || 0,
      totalReuses: row.reuses || 0,
    };
  }

  private static calculateSimilarity(s1: string, s2: string): number {
    const words1 = new Set(s1.split(' '));
    const words2 = new Set(s2.split(' '));
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }
}
