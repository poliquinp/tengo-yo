#!/usr/bin/env node
/**
 * Rend un gabarit HTML en image avec Chrome (headless), sans dépendance npm.
 *
 *   node tools/social/render.mjs <gabarit.html> <sortie.png|.jpg> --size 1200x630
 *
 * - .png : capture directe de Chrome.
 * - .jpg : capture PNG puis conversion avec ffmpeg (qualité élevée), plus léger pour le partage.
 * Chrome est cherché aux emplacements habituels, ou via la variable CHROME_PATH.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const args = process.argv.slice(2);
const sizeIdx = args.indexOf('--size');
const [w, h] = (sizeIdx >= 0 ? args.splice(sizeIdx, 2)[1] : '1200x630').split('x').map(Number);
const [input, output] = args;
if (!input || !output || !w || !h) {
  console.error('Usage : node tools/social/render.mjs <gabarit.html> <sortie.png|.jpg> --size 1200x630');
  process.exit(1);
}

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chrome = candidates.find((p) => existsSync(p));
if (!chrome) {
  console.error('Chrome introuvable. Définir CHROME_PATH.');
  process.exit(1);
}

const out = resolve(output);
mkdirSync(dirname(out), { recursive: true });
const isJpg = ['.jpg', '.jpeg'].includes(extname(out).toLowerCase());
const png = isJpg ? resolve(tmpdir(), `render-${process.pid}.png`) : out;

const res = spawnSync(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--allow-file-access-from-files',
  '--virtual-time-budget=3000', // laisse le temps aux polices et images de charger
  `--window-size=${w},${h}`,
  `--screenshot=${png}`,
  pathToFileURL(resolve(input)).href,
], { stdio: 'pipe' });
if (!existsSync(png)) {
  console.error('Échec du rendu Chrome :', res.stderr?.toString());
  process.exit(1);
}

if (isJpg) {
  const ff = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', png, '-q:v', '2', out], { stdio: 'inherit' });
  rmSync(png, { force: true });
  if (ff.status !== 0) {
    console.error('Conversion JPG impossible (ffmpeg requis). Utiliser une sortie .png.');
    process.exit(1);
  }
}
console.log(`${out}  (${w} x ${h}, ${Math.round(statSync(out).size / 1024)} Ko)`);
