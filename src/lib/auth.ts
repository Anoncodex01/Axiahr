import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

// JWT_SECRET is required in production
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Type assertion: JWT_SECRET is guaranteed to be a string after the check above
const JWT_SECRET_STRING: string = JWT_SECRET;

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
export const generateToken = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET_STRING, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET_STRING);
  } catch (error: any) {
    // Provide more detailed error information
    const errorMessage = error.name === 'TokenExpiredError' 
      ? 'Token expired' 
      : error.name === 'JsonWebTokenError'
      ? `JWT Error: ${error.message}`
      : 'Invalid token';
    throw new Error(errorMessage);
  }
};
