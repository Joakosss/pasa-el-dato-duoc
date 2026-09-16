export function EsRunValido(valor: unknown): boolean {
    if (typeof valor !== 'string') {
        return false;
    }

    // Exige uno o más dígitos, un guion y un dígito o K al final.
    return /^\d+-[\dK]$/.test(valor);
}