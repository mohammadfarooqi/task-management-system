export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-1-2-3',
  expiresIn: '24h',
};