import { verify } from '@node-rs/argon2';
import { generarHashContrasena, verificarContrasena } from './contrasena-hash.js';

describe('generarHashContrasena', () => {
  it('genera un hash Argon2id verificable', async () => {
    const contrasena = 'ClaveDePrueba123';

    // Generamos el valor que más adelante irá en cuenta.clave_hash.
    const hashGenerado = await generarHashContrasena(contrasena);

    // El resultado identifica el algoritmo y no es la contraseña original.
    expect(hashGenerado).toMatch(/^\$argon2id\$/);
    expect(hashGenerado).not.toBe(contrasena);

    // verify compara la contraseña con el hash; no lo «descifra».
    expect(await verify(hashGenerado, contrasena)).toBe(true);
    expect(await verify(hashGenerado, 'OtraClave123')).toBe(false);

    expect(await verificarContrasena(contrasena, hashGenerado)).toBe(true);
    expect(await verificarContrasena('OtraClave123', hashGenerado)).toBe(false);
  });
});