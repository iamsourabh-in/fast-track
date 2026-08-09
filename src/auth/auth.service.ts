import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User, AuditLog } from '../memory/mongo.js';
import { config } from '../config/env.js';

const JWT_SECRET = config.jwtSecret || 'fastapply-enterprise-saas-secret-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export class AuthService {
  public static async register(email: string, password: string, fullName: string, ip: string = '127.0.0.1') {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      throw new Error('User with this email address already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      email: email.toLowerCase().trim(),
      passwordHash,
      fullName: fullName.trim(),
      role: 'user'
    });
    
    await newUser.save();
    
    const userId = newUser._id.toString();
    
    await new AuditLog({
      userId,
      action: 'REGISTER',
      details: `Created new user account for ${email}`,
      ipAddress: ip
    }).save();

    const payload = { id: userId, email: newUser.email, fullName: newUser.fullName, role: newUser.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    
    return { token, user: payload };
  }

  public static async login(email: string, password: string, ip: string = '127.0.0.1') {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new Error('Invalid email or password.');
    }

    const userId = user._id.toString();
    
    await new AuditLog({
      userId,
      action: 'LOGIN',
      details: `Successful user authentication for ${email}`,
      ipAddress: ip
    }).save();

    const payload = { id: userId, email: user.email, fullName: user.fullName, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    
    return { token, user: payload };
  }

  public static authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || (req.query.token as string);

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
      } else {
        req.user = decoded;
      }
      next();
    });
  }
}
