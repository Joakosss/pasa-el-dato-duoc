import {
  calcularHashRefreshToken,
  generarRefreshToken,
} from './refresh-token.js';

describe('refresh token', () => {
  it('genera un token nuevo y permite reproducir su hash', () => {
    const primero = generarRefreshToken();
    const segundo = generarRefreshToken();

    expect(primero.token).not.toBe(segundo.token);
    expect(primero.tokenHash).toBe(
      calcularHashRefreshToken(primero.token),
    );
    expect(primero.tokenHash).not.toBe(primero.token);
  });
});