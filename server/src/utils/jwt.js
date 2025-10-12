import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'dev-secret';
const defaultExpiresIn = '1d';

export function signJwt(payload, options = {}) {
  return jwt.sign(payload, secret, { expiresIn: defaultExpiresIn, ...(options || {}) });
}

export function verifyJwt(token) {
  try {
    return jwt.verify(token, secret);
  } catch (e) {
    return null;
  }
}
