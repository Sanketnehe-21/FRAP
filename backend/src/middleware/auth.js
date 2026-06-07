import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errors.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Not authenticated: Missing or invalid token format'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    next(new UnauthorizedError('Not authenticated: Invalid or expired token'));
  }
}
