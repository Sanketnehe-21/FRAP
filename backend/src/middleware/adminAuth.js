import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { userModel } from '../models/userModel.js';

export async function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Not authenticated: Missing or invalid token format'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    
    // Fetch the user from the database to check role and status
    const user = await userModel.findById(null, payload.sub);
    if (!user) {
      return next(new UnauthorizedError('Not authenticated: User not found'));
    }

    if (user.status !== 'ACTIVE') {
      return next(new ForbiddenError('Access Denied: Your account is suspended or deactivated'));
    }

    const validRoles = ['PLATFORM_ADMIN', 'SUPPORT_ADMIN', 'READ_ONLY_ADMIN'];
    if (!validRoles.includes(user.system_role)) {
      return next(new ForbiddenError('Access Denied: You do not have administrator permissions'));
    }

    // Set full user details in req.user
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.full_name,
      systemRole: user.system_role,
      status: user.status
    };

    next();
  } catch (err) {
    next(new UnauthorizedError('Not authenticated: Invalid or expired token'));
  }
}

// Role-specific guards
export function requirePlatformAdmin(req, res, next) {
  if (req.user.systemRole !== 'PLATFORM_ADMIN') {
    return next(new ForbiddenError('Access Denied: Platform Administrator role required'));
  }
  next();
}

export function requireSupportOrPlatformAdmin(req, res, next) {
  const allowed = ['PLATFORM_ADMIN', 'SUPPORT_ADMIN'];
  if (!allowed.includes(req.user.systemRole)) {
    return next(new ForbiddenError('Access Denied: Platform or Support Administrator role required'));
  }
  next();
}
