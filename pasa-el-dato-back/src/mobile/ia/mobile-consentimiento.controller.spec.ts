import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { MobileConsentimientoController } from './mobile-consentimiento.controller.js';
import { MobileConsentimientoService } from './mobile-consentimiento.service.js';

describe('controlador de consentimiento mobile', () => {
  const id = '10000000-0000-0000-0000-000000000001';
  const cuenta = '00000000-0000-0000-0000-000000000001';
  const autorizar = vi.fn().mockResolvedValue({ registrado: true });
  let app: import('@nestjs/common').INestApplication;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [MobileConsentimientoController],
      providers: [{ provide: MobileConsentimientoService, useValue: { autorizar } }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (contexto: import('@nestjs/common').ExecutionContext) => {
          contexto.switchToHttp().getRequest().user = { idCuenta: cuenta };
          return true;
        },
      })
      .compile();
    app = modulo.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('protege el controlador con autenticación JWT', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, MobileConsentimientoController))
      .toContain(JwtAuthGuard);
  });

  it.each([undefined, false, 'true'])('rechaza confirmado=%s', async (confirmado) => {
    autorizar.mockClear();
    await request(app.getHttpServer())
      .post(`/mobile/ia/publicaciones/${id}/consentimiento`)
      .send({ confirmado, titulo: 'Título', descripcion: 'Descripción' })
      .expect(400);
    expect(autorizar).not.toHaveBeenCalled();
  });

  it('acepta confirmación explícita y pasa el texto y la cuenta autenticada', async () => {
    autorizar.mockClear();
    await request(app.getHttpServer())
      .post(`/mobile/ia/publicaciones/${id}/consentimiento`)
      .send({ confirmado: true, titulo: 'Título', descripcion: 'Descripción' })
      .expect(201);
    expect(autorizar).toHaveBeenCalledWith(id, cuenta, 'Título', 'Descripción');
  });
});
