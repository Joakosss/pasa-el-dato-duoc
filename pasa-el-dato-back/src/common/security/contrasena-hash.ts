import { hash, verify } from '@node-rs/argon2';

export async function generarHashContrasena(
    contrasena: string
): Promise<string> {
    return hash(contrasena, {
        memoryCost: 19_456,
        timeCost: 2,
        parallelism: 1,
    })
}

export async function verificarContrasena(
    contrasena: string,
    hashAlmacenado: string,
): Promise<boolean> {
    // La libreria recibe el hash guardado y luego la contraseña.
    return verify(hashAlmacenado, contrasena);
}