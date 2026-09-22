import { hash } from '@node-rs/argon2';

export async function generarHashContrasena(
    contrasena: string
): Promise<string> {
    return hash(contrasena, {
        memoryCost: 19_456,
        timeCost: 2,
        parallelism: 1,
    })
}