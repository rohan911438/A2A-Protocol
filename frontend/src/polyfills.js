import { Buffer } from 'buffer';

window.global = window;
window.Buffer = Buffer;
window.process = {
  // Reflect the actual Vite build mode instead of always claiming
  // 'development' - bundled deps that branch on NODE_ENV (extra warnings,
  // dev-only code paths) would otherwise behave as dev builds even in the
  // production bundle served from Netlify.
  env: { NODE_ENV: import.meta.env.PROD ? 'production' : 'development' },
  browser: true,
  version: '',
  nextTick: (fn) => setTimeout(fn, 0),
};
