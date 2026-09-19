// Converts the large PNG artwork in public/images to WebP at two widths.
// Usage: node scripts/optimize-images.mjs  (re-run after replacing a source PNG)
import sharp from 'sharp';
import { stat } from 'node:fs/promises';

const dir = 'public/images/';
const sources = [
  'hero-botanical-person-free', 'reference-products', 'reference-flower-finish', 'reference-harvest',
  'reference-leaves', 'reference-botanical-edge', 'reference-city', 'reference-values-still-life',
  'reference-footer-sprig', 'ui-basket',
];
const widths = [[800, '-800'], [1600, '']];

for (const name of sources) {
  const input = `${dir}${name}.png`;
  for (const [width, suffix] of widths) {
    const output = `${dir}${name}${suffix}.webp`;
    await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 78, alphaQuality: 85, effort: 5 }).toFile(output);
    const [a, b] = await Promise.all([stat(input), stat(output)]);
    console.log(`${output}  ${(b.size / 1024).toFixed(0)}KB  (source ${(a.size / 1024).toFixed(0)}KB)`);
  }
}
