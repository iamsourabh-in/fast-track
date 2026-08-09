import mongoose from 'mongoose';
import { config } from '../config/env.js';

// Suppress mongoose deprecation warnings
mongoose.set('strictQuery', false);

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  details: { type: String, default: '' },
  ipAddress: { type: String, default: '127.0.0.1' },
  createdAt: { type: Date, default: Date.now }
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

const candidateProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fullName: { type: String, required: true },
  roleTitle: { type: String, default: '' },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  githubUrl: { type: String, default: '' },
  portfolioUrl: { type: String, default: '' },
  yearsExperience: { type: Number, default: 0 },
  location: { type: String, default: '' },
  requiresSponsorship: { type: Boolean, default: false },
  authorizedToWork: { type: Boolean, default: true },
  skills: { type: [String], default: [] },
  companies: { type: [String], default: [] },
  summary: { type: String, default: '' },
  resumeSourceUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const CandidateProfile = mongoose.model('CandidateProfile', candidateProfileSchema);

const qaMemorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questionNormalized: { type: String, required: true },
  questionRaw: { type: String, required: true },
  answer: { type: String, required: true },
  confidence: { type: Number, default: 1.0 },
  usageCount: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

qaMemorySchema.index({ userId: 1, questionNormalized: 1 }, { unique: true });
export const QAMemory = mongoose.model('QAMemory', qaMemorySchema);

const userJobSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobKey: { type: String, required: true },
  company: { type: String, required: true },
  title: { type: String, required: true },
  location: { type: String, default: 'Remote' },
  jobUrl: { type: String, required: true },
  source: { type: String, required: true },
  salary: { type: String, default: '' },
  description: { type: String, default: '' },
  status: { type: String, enum: ['queued', 'applied', 'skipped', 'failed'], default: 'queued' },
  createdAt: { type: Date, default: Date.now }
});

userJobSchema.index({ userId: 1, jobKey: 1 }, { unique: true });
export const UserJob = mongoose.model('UserJob', userJobSchema);

const appliedJobSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobKey: { type: String, required: true },
  company: { type: String, required: true },
  title: { type: String, required: true },
  location: { type: String, default: '' },
  jobUrl: { type: String, required: true },
  applyMode: { type: String, required: true },
  status: { type: String, enum: ['applied', 'skipped', 'failed', 'pending'], required: true },
  notes: { type: String, default: '' },
  appliedAt: { type: Date, default: Date.now }
});

export const AppliedJob = mongoose.model('AppliedJob', appliedJobSchema);

export async function connectDatabase() {
  try {
    await mongoose.connect(config.mongoUri || 'mongodb://localhost:27017/fasttrack');
    console.log('Successfully connected to MongoDB.');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}
