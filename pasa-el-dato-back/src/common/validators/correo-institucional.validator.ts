import { registerDecorator, type ValidationOptions, } from 'class-validator';

// Decorador personalizado para validar el correo institucional
export function EsCorreoInstitucional(
    // con eso se pueden personalizar las configs de class-validator
    opciones?: ValidationOptions,
): PropertyDecorator {
    return (objeto: object, propiedad: string | symbol) => {
        registerDecorator({
            name: 'esCorreoInstitucional',
            target: objeto.constructor,
            propertyName: String(propiedad),//Campo del dto que se va a validar
            options: opciones,
            validator: {
                validate(valor: unknown): boolean {
                    return (
                        typeof valor === 'string' && 
                        valor.trim().toLowerCase().endsWith('@duocuc.cl')
                    );
                },
                defaultMessage(): string {
                    return 'El correo debe ser institucional y terminar con @duocuc.cl';
                },
            },
        });
    };
}