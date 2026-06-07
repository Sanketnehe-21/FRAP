import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function signToken(userId, email) {
  // Config specifies expiration in milliseconds. JWT expects either a number of seconds or a string duration.
  // Converting milliseconds to a string like '86400000ms' or dividing by 1000.
  return jwt.sign({ sub: userId, email }, config.jwtSecret, {
    expiresIn: `${config.jwtExpirationMs}ms`,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}
