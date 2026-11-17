import { validateEnvironment } from './environment.validation.js';

describe('validateEnvironment', () => {
  const validEnvironment = {
    PORT: '3000',
    FRONTEND_URL: 'http://localhost:3001',
    DATABASE_URL:
      'postgresql://taskflow:local-password@localhost:5432/taskflow?schema=public',
    JWT_ACCESS_SECRET: 'a-different-access-secret-with-32-characters',
    JWT_REFRESH_SECRET: 'a-separate-refresh-secret-with-32-characters',
    ACCESS_TOKEN_TTL: '15m',
    REFRESH_TOKEN_TTL: '7d',
  };

  it('converts the port to a number', () => {
    expect(validateEnvironment(validEnvironment).PORT).toBe(3000);
  });

  it('converts token lifetimes to seconds', () => {
    const config = validateEnvironment(validEnvironment);

    expect(config.ACCESS_TOKEN_TTL_SECONDS).toBe(900);
    expect(config.REFRESH_TOKEN_TTL_SECONDS).toBe(604800);
  });

  it('uses the default port when one is not provided', () => {
    const { PORT: _port, ...environment } = validEnvironment;

    expect(validateEnvironment(environment).PORT).toBe(3000);
  });

  it('accepts multiple frontend origins for deployment previews', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        FRONTEND_URL:
          'https://task-flow-app-delta-one.vercel.app, https://taskflow-preview.vercel.app',
      }),
    ).not.toThrow();
  });

  it('allows GitHub App integration to remain unconfigured', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        GITHUB_APP_ID: '',
        GITHUB_APP_SLUG: '',
        GITHUB_APP_PRIVATE_KEY: '',
        GITHUB_APP_WEBHOOK_SECRET: '',
      }),
    ).not.toThrow();
  });

  it('requires all GitHub App credentials together', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        GITHUB_APP_ID: '12345',
      }),
    ).toThrow('must be configured together');
  });

  it('requires a strong GitHub webhook secret when integration is enabled', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        GITHUB_APP_ID: '12345',
        GITHUB_APP_SLUG: 'taskflow',
        GITHUB_APP_PRIVATE_KEY: 'private-key',
        GITHUB_APP_WEBHOOK_SECRET: 'too-short',
      }),
    ).toThrow('GITHUB_APP_WEBHOOK_SECRET must be at least 32 characters long');
  });

  it.each([
    ['PORT', '70000'],
    ['FRONTEND_URL', 'not-a-url'],
    ['FRONTEND_URL', 'https://valid.example.com,not-a-url'],
    ['DATABASE_URL', 'mysql://localhost/taskflow'],
    ['JWT_ACCESS_SECRET', 'too-short'],
    ['ACCESS_TOKEN_TTL', '15 weeks'],
  ])('rejects invalid %s configuration', (key, value) => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, [key]: value }),
    ).toThrow('Invalid environment configuration');
  });

  it('requires different signing secrets', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        JWT_REFRESH_SECRET: validEnvironment.JWT_ACCESS_SECRET,
      }),
    ).toThrow('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different');
  });
});
