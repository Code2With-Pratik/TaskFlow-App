import {
  isAllowedFrontendOrigin,
  normalizeFrontendOrigin,
} from './frontend-origin.js';

describe('frontend origin allowlist', () => {
  const allowedOrigins = [
    normalizeFrontendOrigin(
      'https://task-flow-*-pratik-dhandares-projects-ce46116e.vercel.app',
    ),
    normalizeFrontendOrigin('https://task-flow-app-delta-one.vercel.app'),
  ];

  it('allows matching Vercel deployment previews', () => {
    expect(
      isAllowedFrontendOrigin(
        'https://task-flow-qdcnu5491-pratik-dhandares-projects-ce46116e.vercel.app',
        allowedOrigins,
      ),
    ).toBe(true);
  });

  it('does not allow other Vercel projects or unrelated origins', () => {
    expect(
      isAllowedFrontendOrigin(
        'https://another-app-qdcnu5491-pratik-dhandares-projects-ce46116e.vercel.app',
        allowedOrigins,
      ),
    ).toBe(false);
    expect(
      isAllowedFrontendOrigin('https://attacker.example', allowedOrigins),
    ).toBe(false);
  });

  it('normalizes exact origins and still allows them', () => {
    expect(
      isAllowedFrontendOrigin(
        'https://task-flow-app-delta-one.vercel.app',
        allowedOrigins,
      ),
    ).toBe(true);
  });
});
