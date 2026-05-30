// Idempotent icon generator for Y7SK — rasterizes the brand SVGs into the full
// platform icon set (PNG/ICO/ICNS) consumed by electron-builder and the runtime.
// Run with: bun scripts/generate-icons.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import png2icons from 'png2icons';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const SRC_MARK = join(root, 'assets', 'y7sk.svg');
const SRC_TRAY = join(root, 'assets', 'y7sk-tray.svg');

// Rasterize an SVG to a PNG of the given square size via rsvg-convert.
function svgToPng(src, size, out) {
  mkdirSync(dirname(out), { recursive: true });
  execFileSync('rsvg-convert', ['-w', String(size), '-h', String(size), src, '-o', out]);
  console.log(`  wrote ${out} (${size}x${size})`);
}

console.log('Generating Y7SK icons...');

// 1. App mark PNGs --------------------------------------------------------
svgToPng(SRC_MARK, 1024, join(root, 'build', 'icon.png'));        // electron-builder base
svgToPng(SRC_MARK, 512, join(root, 'resources', 'icon.png'));     // runtime window icon

// Linux size-named set (filename = WxH).
for (const s of [16, 24, 32, 48, 64, 128, 256, 512]) {
  svgToPng(SRC_MARK, s, join(root, 'build', 'icons', `${s}x${s}.png`));
}

// 2. ICO + ICNS from the 1024 master buffer ------------------------------
const master = readFileSync(join(root, 'build', 'icon.png'));

const ico = png2icons.createICO(master, png2icons.BICUBIC, 0, false);
if (!ico) throw new Error('png2icons.createICO returned null');
writeFileSync(join(root, 'build', 'icon.ico'), ico);
console.log(`  wrote ${join(root, 'build', 'icon.ico')} (${ico.length} bytes)`);

const icns = png2icons.createICNS(master, png2icons.BICUBIC, 0);
if (!icns) throw new Error('png2icons.createICNS returned null');
writeFileSync(join(root, 'build', 'icon.icns'), icns);
console.log(`  wrote ${join(root, 'build', 'icon.icns')} (${icns.length} bytes)`);

// 3. Tray glyphs ----------------------------------------------------------
const trayDir = join(root, 'resources', 'tray');
svgToPng(SRC_TRAY, 32, join(trayDir, 'tray.png'));     // Windows/Linux white glyph
svgToPng(SRC_TRAY, 64, join(trayDir, 'tray@2x.png'));  // hi-dpi variant

// macOS template image: black silhouette on alpha (macOS recolors templates).
const trayTemplate = join(trayDir, 'trayTemplate.png');
mkdirSync(trayDir, { recursive: true });
const whiteTray = join(trayDir, 'tray.png');           // reuse the white 32px alpha shape
// Recolor white glyph to black, preserving alpha, at 22x22 for the template.
execFileSync('magick', [
  whiteTray,
  '-resize', '22x22',
  '-channel', 'RGB', '-evaluate', 'set', '0%', '+channel',
  trayTemplate,
]);
console.log(`  wrote ${trayTemplate} (22x22, black-on-alpha template)`);

console.log('Done.');
