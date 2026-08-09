import { QAMemory } from './mongo.js';

export interface QARecord {
  id: string;
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
  public static async findAnswer(questionRaw: string, userId: string): Promise<QARecord | null> {
    const normalized = this.normalizeQuestion(questionRaw);
    
    // 1. Direct exact match on normalized string for userId
    const exact = await QAMemory.findOne({ userId, questionNormalized: normalized });
    if (exact) {
      await QAMemory.updateOne(
        { _id: exact._id },
        { $inc: { usageCount: 1 }, $set: { updatedAt: new Date() } }
      );
      return this.mapToRecord(exact, exact.usageCount + 1);
    }

    // 2. Fuzzy / Containment match with Category Safety for userId
    const all = await QAMemory.find({ userId }).lean();
    for (const record of all as any[]) {
      const isEmailPhoneQuery = normalized.includes('email') || normalized.includes('phone') || normalized.includes('mobile');
      const isEmailPhoneRecord = record.questionNormalized.includes('email') || record.questionNormalized.includes('phone') || record.questionNormalized.includes('mobile');

      if (isEmailPhoneQuery !== isEmailPhoneRecord) {
        continue;
      }

      const sim = this.calculateSimilarity(normalized, record.questionNormalized);
      const isSub = normalized.includes(record.questionNormalized) || record.questionNormalized.includes(normalized);
      const sharesKeyWords = this.sharesKeyTokens(normalized, record.questionNormalized);

      if (sim >= 0.6 || isSub || sharesKeyWords) {
        await QAMemory.updateOne(
          { _id: record._id },
          { $inc: { usageCount: 1 }, $set: { updatedAt: new Date() } }
        );
        return this.mapToRecord(record, record.usageCount + 1);
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
  public static async saveAnswer(questionRaw: string, answer: string, confidence: number = 1.0, userId: string): Promise<QARecord> {
    const normalized = this.normalizeQuestion(questionRaw);
    const safeAnswer = (answer !== undefined && answer !== null ? String(answer) : '').trim() || 'N/A';
    
    const doc = await QAMemory.findOneAndUpdate(
      { userId, questionNormalized: normalized },
      {
        $set: {
          questionRaw,
          answer: safeAnswer,
          confidence,
          updatedAt: new Date()
        },
        $inc: { usageCount: 1 }
      },
      { upsert: true, new: true }
    ).lean();

    return this.mapToRecord(doc);
  }

  public static async getAllMemories(userId: string): Promise<QARecord[]> {
    const docs = await QAMemory.find({ userId }).sort({ usageCount: -1 }).lean();
    return docs.map((doc: any) => this.mapToRecord(doc));
  }

  public static async updateMemory(id: string, answer: string, userId: string): Promise<boolean> {
    const safeAnswer = (answer ?? '').trim() || 'N/A';
    const result = await QAMemory.findOneAndUpdate(
      { _id: id, userId },
      { $set: { answer: safeAnswer, updatedAt: new Date() } }
    );
    return !!result;
  }

  public static async deleteMemory(id: string, userId: string): Promise<boolean> {
    const result = await QAMemory.deleteOne({ _id: id, userId });
    return result.deletedCount === 1;
  }

  public static async clearAllMemories(userId: string): Promise<void> {
    await QAMemory.deleteMany({ userId });
    console.log(`[QAMemoryEngine] Cleared all cached memories for user #${userId}.`);
  }

  public static async getStats(userId: string): Promise<{ totalAnswers: number; totalReuses: number }> {
    const totalAnswers = await QAMemory.countDocuments({ userId });
    
    const aggregation = await QAMemory.aggregate([
      { $match: { userId: userId.toString() } }, // Make sure to match ObjectId or string correctly, depending on schema
      { $group: { _id: null, totalReuses: { $sum: "$usageCount" } } }
    ]);
    
    const totalReuses = aggregation.length > 0 ? aggregation[0].totalReuses : 0;
    
    return {
      totalAnswers,
      totalReuses,
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

  private static mapToRecord(doc: any, overrideUsageCount?: number): QARecord {
    return {
      id: doc._id.toString(),
      question_normalized: doc.questionNormalized,
      question_raw: doc.questionRaw,
      answer: doc.answer,
      confidence: doc.confidence,
      usage_count: overrideUsageCount ?? doc.usageCount
    };
  }
}
