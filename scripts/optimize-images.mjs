/**
 * Image optimization pipeline.
 *
 * Scans the artwork folders under /public, and for every source image it:
 *   1. Generates responsive WebP renditions at several widths.
 *   2. Generates a tiny blurred LQIP (base64) for smooth blur-up loading.
 *   3. Records intrinsic dimensions + average colour in a manifest.
 *
 * The <Pic> component reads the manifest at build time, so the artist never
 * has to think about sizes, srcsets or formats — she just drops a full-size
 * JPG/PNG into /public/works (or uses the /admin uploader) and rebuilds.
 *
 * Safe to run repeatedly: renditions are skipped when already newer than source.
 */
import { readdir, stat, mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const MANIFEST_PATH = path.join(ROOT, 'src', 'data', 'image-manifest.json');

// Folders (relative to /public) that hold optimizable artwork.
const SCAN_DIRS = ['works', 'projects', 'site'];
const WIDTHS = [400, 800, 1280, 1920, 2400];
const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const OPT_DIRNAME = '_opt';
const MIN_BYTES = 1024; // skip the corrupt 2-byte placeholder files

const toPosix = (p) => p.split(path.sep).join('/');

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === OPT_DIRNAME) continue;
      out.push(...(await walk(full)));
    } else if (EXT.has(path.extname(e.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

async function newerThan(target, source) {
  if (!existsSync(target)) return false;
  const [t, s] = await Promise.all([stat(target), stat(source)]);
  return t.mtimeMs >= s.mtimeMs;
}

async function processFile(file, manifest) {
  const rel = toPosix(path.relative(PUBLIC, file)); // e.g. works/lion.jpg
  const publicPath = '/' + rel;
  const { size } = await stat(file);
  if (size < MIN_BYTES) {
    console.warn(`  ↳ skipping (too small / corrupt): ${rel}`);
    return;
  }

  let img, meta;
  try {
    img = sharp(file, { failOn: 'none' });
    meta = await img.metadata();
  } catch (err) {
    console.warn(`  ↳ skipping (unreadable): ${rel} — ${err.message}`);
    return;
  }

  const width = meta.width || 1200;
  const height = meta.height || 800;
  const dir = path.dirname(file);
  const optDir = path.join(dir, OPT_DIRNAME);
  await mkdir(optDir, { recursive: true });

  const base = path.basename(file, path.extname(file));
  const targetWidths = WIDTHS.filter((w) => w <= width);
  if (targetWidths.length === 0) targetWidths.push(width);

  const sources = [];
  for (const w of targetWidths) {
    const outName = `${base}-${w}.webp`;
    const outPath = path.join(optDir, outName);
    if (!(await newerThan(outPath, file))) {
      await sharp(file, { failOn: 'none' })
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 80, effort: 5 })
        .toFile(outPath);
    }
    sources.push({ w, src: toPosix('/' + path.relative(PUBLIC, outPath)) });
  }

  // LQIP — tiny blurred base64 preview.
  let lqip = '';
  try {
    const buf = await sharp(file, { failOn: 'none' })
      .rotate()
      .resize({ width: 24 })
      .blur(1.2)
      .webp({ quality: 40 })
      .toBuffer();
    lqip = `data:image/webp;base64,${buf.toString('base64')}`;
  } catch {
    /* non-fatal */
  }

  // Average colour for graceful background before LQIP paints.
  let color = '#e9e2d3';
  try {
    const { dominant } = await sharp(file, { failOn: 'none' }).stats();
    if (dominant) {
      const { r, g, b } = dominant;
      color = `rgb(${r}, ${g}, ${b})`;
    }
  } catch {
    /* non-fatal */
  }

  manifest[publicPath] = {
    width,
    height,
    aspect: +(width / height).toFixed(4),
    lqip,
    color,
    sources,
  };
  return rel;
}

async function main() {
  const start = Date.now();
  const manifest = {};
  let count = 0;

  for (const d of SCAN_DIRS) {
    const dir = path.join(PUBLIC, d);
    const files = await walk(dir);
    for (const f of files) {
      const done = await processFile(f, manifest);
      if (done) count++;
    }
  }

  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  // Sort keys for stable diffs.
  const sorted = Object.fromEntries(
    Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b))
  );
  await writeFile(MANIFEST_PATH, JSON.stringify(sorted, null, 2) + '\n');

  console.log(
    `✓ optimized ${count} image${count === 1 ? '' : 's'} → ${WIDTHS.join('/')}px WebP ` +
      `(${((Date.now() - start) / 1000).toFixed(1)}s)`
  );
}

main().catch((err) => {
  console.error('Image optimization failed:', err);
  process.exit(1);
});
