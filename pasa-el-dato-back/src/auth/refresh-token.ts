import { createHash, randomBytes } from 'node:crypto';

export function calcularHashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generarRefreshToken(): {
  token: string;
  tokenHash: string;
} {
  const token = randomBytes(32).toString('base64url');

  return {
    token, 
    tokenHash: calcularHashRefreshToken(token), 
  };
}