// Build the Mini App static site: copy web/ -> dist/ and place the
// chosen v3 logo as dist/logo.webp. Run before every push — `push`
// uploads dist/ as-is and never runs the build.
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(root, 'web'), dist, { recursive: true });

const logo = join(
  root,
  'media-generation-watch-satellite-tv-logo-v3-0-2b204f0d-e168-4ec6-aee5-bf1b6d8bb9ab.webp',
);
if (existsSync(logo)) {
  copyFileSync(logo, join(dist, 'logo.webp'));
  console.log('logo: v3 -> dist/logo.webp');
} else {
  console.warn('logo: v3 file not found, dist/logo.webp not written');
}
console.log('build: web/ -> dist/ done');
