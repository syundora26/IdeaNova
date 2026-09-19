// Removes the white background from the supplied logo ("color to alpha") and trims it.
// Usage: node scripts/make-logo.mjs  → public/images/ideanova-logo.png / .webp
import sharp from 'sharp';

const source = 'assets-src/ideanova-logo-original.jpg';
const { data, info } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const out = Buffer.alloc(info.width * info.height * 4);
for (let i = 0, o = 0; i < data.length; i += 3, o += 4) {
  const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
  // Opacity is how far the darkest channel sits from white; near-white JPEG noise becomes fully clear.
  let a = (255 - Math.min(r, g, b)) / 255;
  a = a < .025 ? 0 : Math.min(1, (a - .025) / .975);
  const un = c => a ? Math.max(0, Math.min(255, Math.round((c - 255 * (1 - a)) / a))) : 0;
  out[o] = un(r); out[o + 1] = un(g); out[o + 2] = un(b); out[o + 3] = Math.round(a * 255);
}
const trimmed = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer()
  .then(buf => sharp(buf).trim({ threshold: 1 }).extend({ top: 8, bottom: 8, left: 8, right: 8, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer());
await sharp(trimmed).toFile('public/images/ideanova-logo.png');
await sharp(trimmed).webp({ quality: 90, alphaQuality: 100 }).toFile('public/images/ideanova-logo.webp');
const meta = await sharp(trimmed).metadata();
console.log(`ideanova-logo ${meta.width}x${meta.height}`);
