import assert from 'node:assert/strict';
import test from 'node:test';

import { coincideTextoBusqueda } from '../src/lib/busqueda/coincide-texto.ts';

const campos = ['Tazón', 'Buen estado', 'Hogar', 'Producto', 'Puente Alto'];

test('encuentra por nombre, apellido o nombre y apellido', () => {
  for (const consulta of ['ana', 'perez', 'ANA   PÉREZ', '  Ana Pérez  ']) {
    assert.equal(coincideTextoBusqueda(consulta, campos, 'Ana Pérez'), true);
  }
});

test('conserva la búsqueda por los campos de la publicación', () => {
  for (const consulta of ['tazon', 'buen estado', 'hogar', 'producto', 'puente alto']) {
    assert.equal(coincideTextoBusqueda(consulta, campos, 'Ana Pérez'), true);
  }
});

test('no mezcla el nombre con campos de la publicación', () => {
  assert.equal(coincideTextoBusqueda('alto ana', campos, 'Ana Pérez'), false);
  assert.equal(coincideTextoBusqueda('otro vendedor', campos, 'Ana Pérez'), false);
});

test('una consulta vacía muestra la publicación', () => {
  assert.equal(coincideTextoBusqueda('   ', campos, ''), true);
});
