import { Buffer } from 'buffer';

window.global = window;
window.Buffer = Buffer;
window.process = {
  env: { NODE_ENV: 'development' },
  browser: true,
  version: '',
  nextTick: (fn) => setTimeout(fn, 0),
};
