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
  public static findAnswer(questionRaw: string): QARecord | null {
    const normalized = this.normalizeQuestion(questionRaw);
    
    // 1. Direct exact match on normalized string
    const exact = db.prepare('SELECT * FROM qa_memory WHERE question_normalized = ?').get(normalized) as QARecord | undefined;
    if (exact) {
      db.prepare('UPDATE qa_memory SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(exact.id);
      return exact;
    }

    // 2. Fuzzy / Containment match with Category Safety
    const all = db.prepare('SELECT * FROM qa_memory').all() as QARecord[];
    for (const record of all) {
      const isEmailPhoneQuery = normalized.includes('email') || normalized.includes('phone') || normalized.includes('mobile');
      const isEmailPhoneRecord = record.question_normalized.includes('email') || record.question_normalized.includes('phone') || record.question_normalized.includes('mobile');

      // Category mismatch guard (e.g. Email/Phone query must not match Name record)
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
  public static saveAnswer(questionRaw: string, answer: string, confidence: number = 1.0): QARecord {
    const normalized = this.normalizeQuestion(questionRaw);
    const safeAnswer = (answer !== undefined && answer !== null ? String(answer) : '').trim() || 'N/A';
    
    db.prepare(`
      INSERT INTO qa_memory (question_normalized, question_raw, answer, confidence, usage_count)
      VALUES (?, ?, ?, ?, 1)
      ON CONFLICT(question_normalized) DO UPDATE SET
        answer = excluded.answer,
        confidence = excluded.confidence,
        usage_count = qa_memory.usage_count + 1,
        updated_at = CURRENT_TIMESTAMP
    `).run(normalized, questionRaw, safeAnswer, confidence);

    return db.prepare('SELECT * FROM qa_memory WHERE question_normalized = ?').get(normalized) as QARecord;
  }

  public static getAllMemories(): QARecord[] {
    return db.prepare('SELECT * FROM qa_memory ORDER BY usage_count DESC, updated_at DESC').all() as QARecord[];
  }

  public static updateMemory(id: number, answer: string): boolean {
    const safeAnswer = (answer ?? '').trim() || 'N/A';
    const result = db.prepare('UPDATE qa_memory SET answer = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(safeAnswer, id);
    return result.changes > 0;
  }

  public static deleteMemory(id: number): boolean {
    const result = db.prepare('DELETE FROM qa_memory WHERE id = ?').run(id);
    return result.changes > 0;
  }

  public static clearAllMemories(): void {
    db.prepare('DELETE FROM qa_memory').run();
    console.log('[QAMemoryEngine] Cleared all cached memories.');
  }

  public static getStats(): { totalAnswers: number; totalReuses: number } {
    const row = db.prepare('SELECT COUNT(*) as total, SUM(usage_count) as reuses FROM qa_memory').get() as { total: number; reuses: number | null };
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
