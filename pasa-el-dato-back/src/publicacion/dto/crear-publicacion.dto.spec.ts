import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CrearPublicacionDto } from './crear-publicacion.dto.js';

// Datos válidos comunes a todas las pruebas del DTO.
const datosPublicacionValidos = {
  titulo: 'Notebook Lenovo ThinkPad',
  descripcion:
    'Notebook en buen estado, 16 GB de RAM y disco de 512 GB. Incluye cargador original.',
  precio: '150000',
  sedeId: '1',
  tipoVentaId: '1',
  categoriaId: '1',
};

describe('CrearPublicacionDto: datos válidos', () => {
  it('acepta y normaliza un formulario multipart válido', async () => {
    const dto = plainToInstance(CrearPublicacionDto, {
      ...datosPublicacionValidos,
      titulo: '  Notebook Lenovo ThinkPad  ',
      descripcion: '  Notebook en buen estado, 16 GB de RAM.  ',
      precio: '150000',
    });

    const errores = await validate(dto);

    expect(dto.titulo).toBe('Notebook Lenovo ThinkPad');
    expect(dto.descripcion).toBe('Notebook en buen estado, 16 GB de RAM.');
    expect(dto.precio).toBe(150000);
    expect(dto.sedeId).toBe(1);
    expect(dto.tipoVentaId).toBe(1);
    expect(dto.categoriaId).toBe(1);
    expect(errores).toHaveLength(0);
  });

  it('acepta descripción de 2.000 caracteres', async () => {
    const dto = plainToInstance(CrearPublicacionDto, {
      ...datosPublicacionValidos,
      descripcion: 'a'.repeat(2000),
    });

    const errores = await validate(dto);

    expect(errores).toHaveLength(0);
  });
});

describe('CrearPublicacionDto: titulo', () => {
  it('rechaza un título de 4 caracteres', async () => {
    const dto = plainToInstance(CrearPublicacionDto, {
      ...datosPublicacionValidos,
      titulo: 'vent', // 4 caracteres
    });

    const errores = await validate(dto);

    expect(errores).toHaveLength(1);
    expect(errores[0].property).toBe('titulo');
  });

  it('rechaza un título de 101 caracteres', async () => {
    const dto = plainToInstance(CrearPublicacionDto, {
      ...datosPublicacionValidos,
      titulo: 'a'.repeat(101),
    });

    const errores = await validate(dto);

    expect(errores).toHaveLength(1);
    expect(errores[0].property).toBe('titulo');
  });

  it('rechaza un título que no es texto', async () => {
    const dto = plainToInstance(CrearPublicacionDto, {
      ...datosPublicacionValidos,
      titulo: 12345,
    });

    const errores = await validate(dto);

    expect(errores).toHaveLength(1);
    expect(errores[0].property).toBe('titulo');
  });
});

describe('CrearPublicacionDto: descripcion', () => {
  it('rechaza una descripción de 19 caracteres', async () => {
    const dto = plainToInstance(CrearPublicacionDto, {
      ...datosPublicacionValidos,
      descripcion: 'a'.repeat(19),
    });

    const errores = await validate(dto);

    expect(errores).toHaveLength(1);
    expect(errores[0].property).toBe('descripcion');
  });

  it('rechaza una descripción de 2.001 caracteres', async () => {
    const dto = plainToInstance(CrearPublicacionDto, {
      ...datosPublicacionValidos,
      descripcion: 'a'.repeat(2001),
    });

    const errores = await validate(dto);

    expect(errores).toHaveLength(1);
    expect(errores[0].property).toBe('descripcion');
  });
});

describe('CrearPublicacionDto: precio', () => {
  it('rechaza precio cero', async () => {
    const dto = plainToInstance(CrearPublicacionDto, {
      ...datosPublicacionValidos,
      precio: '0',
    });

    const errores = await validate(dto);

    expect(errores).toHaveLength(1);
    expect(errores[0].property).toBe('precio');
  });

  it('rechaza precio negativo', async () => {
    const dto = plainToInstance(CrearPublicacionDto, {
      ...datosPublicacionValidos,
      precio: '-1000',
    });

    const errores = await validate(dto);

    expect(errores).toHaveLength(1);
    expect(errores[0].property).toBe('precio');
  });

  it('rechaza precio con decimales', async () => {
    const dto = plainToInstance(CrearPublicacionDto, {
      ...datosPublicacionValidos,
      precio: '1500.5',
    });

    const errores = await validate(dto);

    expect(errores).toHaveLength(1);
    expect(errores[0].property).toBe('precio');
  });

  it('rechaza precio no numérico', async () => {
    const dto = plainToInstance(CrearPublicacionDto, {
      ...datosPublicacionValidos,
      precio: 'gratis',
    });

    const errores = await validate(dto);

    expect(errores).toHaveLength(1);
    expect(errores[0].property).toBe('precio');
  });
});

describe('CrearPublicacionDto: catálogos', () => {
  it('rechaza sedeId menor que 1', async () => {
    const dto = plainToInstance(CrearPublicacionDto, {
      ...datosPublicacionValidos,
      sedeId: '0',
    });

    const errores = await validate(dto);

    expect(errores).toHaveLength(1);
    expect(errores[0].property).toBe('sedeId');
  });

  it('rechaza tipoVentaId no numérico', async () => {
    const dto = plainToInstance(CrearPublicacionDto, {
      ...datosPublicacionValidos,
      tipoVentaId: 'abc',
    });

    const errores = await validate(dto);

    expect(errores).toHaveLength(1);
    expect(errores[0].property).toBe('tipoVentaId');
  });

  it('rechaza categoriaId negativo', async () => {
    const dto = plainToInstance(CrearPublicacionDto, {
      ...datosPublicacionValidos,
      categoriaId: '-1',
    });

    const errores = await validate(dto);

    expect(errores).toHaveLength(1);
    expect(errores[0].property).toBe('categoriaId');
  });
});
