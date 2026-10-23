import { plainToInstance } from 'class-transformer';
import { describe, expect, it } from 'vitest';
import { PerfilRespuestaDto } from './perfil-respuesta.dto.js';

const datosValidos = {
  run: '12345678-9',
  pNombre: 'Ana',
  sNombre: null as string | null,
  pApellido: 'Soto',
  sApellido: 'Rivas',
  correo: 'ana.soto@duocuc.cl',
  telefono: '912345678',
  sede: { nombre: 'Puente Alto' },
  carrera: { nombre: 'Ingeniería en Informática' },
  rol: { descripcion: 'Estudiante' },
};

// El DTO de respuesta es contrato de salida: documenta con Swagger
// pero no lleva validadores class-validator (patrón SedeRespuestaDto).
describe('PerfilRespuestaDto', () => {
  it('mapea todos los campos del contrato', () => {
    const dto = plainToInstance(PerfilRespuestaDto, datosValidos);

    expect(dto).toBeInstanceOf(PerfilRespuestaDto);
    expect(dto.run).toBe('12345678-9');
    expect(dto.pNombre).toBe('Ana');
    expect(dto.sNombre).toBeNull();
    expect(dto.pApellido).toBe('Soto');
    expect(dto.sApellido).toBe('Rivas');
    expect(dto.correo).toBe('ana.soto@duocuc.cl');
    expect(dto.telefono).toBe('912345678');
    expect(dto.sede).toEqual({ nombre: 'Puente Alto' });
    expect(dto.carrera).toEqual({ nombre: 'Ingeniería en Informática' });
    expect(dto.rol).toEqual({ descripcion: 'Estudiante' });
  });

  it('permite sNombre con valor y con null', () => {
    const conValor = plainToInstance(PerfilRespuestaDto, {
      ...datosValidos,
      sNombre: 'María',
    });
    const nulo = plainToInstance(PerfilRespuestaDto, datosValidos);

    expect(conValor.sNombre).toBe('María');
    expect(nulo.sNombre).toBeNull();
  });

  it('define exactamente los campos del contrato, sin sensibles', () => {
    const dto = plainToInstance(PerfilRespuestaDto, datosValidos);

    // El contrato de respuesta contiene solo estos campos.
    expect(Object.keys(dto).sort()).toEqual([
      'correo',
      'pApellido',
      'pNombre',
      'rol',
      'run',
      'sApellido',
      'sNombre',
      'sede',
      'telefono',
      'carrera',
    ].sort());
    expect(dto).not.toHaveProperty('claveHash');
    expect(dto).not.toHaveProperty('clave_hash');
    expect(dto).not.toHaveProperty('tokenHash');
    expect(dto).not.toHaveProperty('idCuenta');
    expect(dto).not.toHaveProperty('id_cuenta');
  });
});
