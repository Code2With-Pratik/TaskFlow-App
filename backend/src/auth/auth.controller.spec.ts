import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  it('returns no content when refresh is requested without a cookie', async () => {
    const authService = { refresh: vi.fn() };
    const config = {
      get: vi.fn().mockReturnValue('development'),
      getOrThrow: vi.fn().mockReturnValue(86_400),
    };
    const response = { status: vi.fn() };
    const controller = new AuthController(
      authService as unknown as AuthService,
      config as unknown as ConfigService,
    );

    await controller.refresh(
      { cookies: {} } as Request,
      response as unknown as Response,
    );

    expect(response.status).toHaveBeenCalledWith(204);
    expect(authService.refresh).not.toHaveBeenCalled();
  });

  it('preserves unauthorized responses for invalid refresh tokens', async () => {
    const authService = {
      refresh: vi.fn().mockRejectedValue(new UnauthorizedException()),
    };
    const config = {
      get: vi.fn().mockReturnValue('development'),
      getOrThrow: vi.fn().mockReturnValue(86_400),
    };
    const controller = new AuthController(
      authService as unknown as AuthService,
      config as unknown as ConfigService,
    );

    await expect(
      controller.refresh(
        { cookies: { taskflow_refresh: 'invalid' } } as Request,
        {} as Response,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
