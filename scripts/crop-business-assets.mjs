// Temporary business-page photographs cut from the approved mockup (docs/reference/business-design.webp, 1361×1156).
// Each card keeps the mockup's own organic outline (and white rim) as alpha, so the page only positions them.
// Replace the outputs in public/images/business/ once the original high-resolution photographs arrive.
// Usage: node scripts/crop-business-assets.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const source = 'docs/reference/business-design.webp';
const out = 'public/images/business/';
await mkdir(out, { recursive: true });

/** Closed Catmull-Rom spline through outline points (mockup px) as an SVG path, relative to the crop origin. */
function smoothPath(points, [x0, y0]) {
  const p = points.map(([x, y]) => [x - x0, y - y0]);
  const n = p.length;
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < n; i++) {
    const [a, b, c, e] = [p[(i - 1 + n) % n], p[i], p[(i + 1) % n], p[(i + 2) % n]];
    d += ` C${b[0] + (c[0] - a[0]) / 6} ${b[1] + (c[1] - a[1]) / 6} ${c[0] - (e[0] - b[0]) / 6} ${c[1] - (e[1] - b[1]) / 6} ${c[0]} ${c[1]}`;
  }
  return d + 'Z';
}
const shapeMask = (d, blur) => (w, h) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><filter id="f" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${blur}"/></filter></defs><path d="${d}" fill="#fff" filter="url(#f)"/></svg>`);
const radialMask = (inner = .5) => (w, h) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><radialGradient id="g" cx=".5" cy=".5" r=".5"><stop offset="${inner}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`);
const edgeMask = ({ top = 0, right = 0 }) => (w, h) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs>
  <linearGradient id="x" x1="0" x2="1"><stop offset="0" stop-color="#fff"/><stop offset="${1 - right}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="y" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${top}" stop-color="#fff"/></linearGradient>
  <mask id="m"><rect width="${w}" height="${h}" fill="url(#y)"/></mask></defs><rect width="${w}" height="${h}" fill="url(#x)" mask="url(#m)"/></svg>`);

/** 'Color to alpha' against the mockup paper (#f5f4ed), so sprigs sit on any paper tone without a visible box. */
async function paperToAlpha(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bg = [245, 244, 237];
  for (let i = 0; i < data.length; i += 4) {
    let a = 0;
    for (let c = 0; c < 3; c++) { const v = data[i + c], b = bg[c]; a = Math.max(a, v > b ? (v - b) / (255 - b) : (b - v) / b); }
    a = Math.min(1, a * 1.15);
    for (let c = 0; c < 3; c++) data[i + c] = a ? Math.max(0, Math.min(255, Math.round((data[i + c] - bg[c]) / a + bg[c]))) : bg[c];
    data[i + 3] = Math.round(data[i + 3] * a);
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

async function crop(name, box, mask, { clearPaper = false } = {}) {
  const [x0, y0, x1, y1] = box, width = x1 - x0, height = y1 - y0;
  let cut = await sharp(source).extract({ left: x0, top: y0, width, height }).ensureAlpha().png().toBuffer();
  if (clearPaper) cut = await paperToAlpha(cut);
  const img = mask ? sharp(cut).composite([{ input: mask(width, height), blend: 'dest-in' }]) : sharp(cut);
  await img.webp({ quality: 90, alphaQuality: 95 }).toFile(`${out}${name}.webp`);
  console.log(`${out}${name}.webp ${width}x${height}`);
}

// Outlines traced from the mockup (outer edge of each photograph, including its white rim).
const cosmeticsOutline = [[58,478],[80,392],[150,338],[300,316],[470,318],[590,352],[660,420],[680,510],[668,600],[628,668],[520,688],[360,674],[210,650],[110,612]];
const agricultureOutline = [[697,560],[722,430],[772,368],[862,332],[1010,325],[1180,331],[1284,376],[1322,462],[1322,590],[1296,676],[1160,708],[980,696],[830,656],[730,612]];
const cosmeticsBox = [30, 300, 700, 700], agricultureBox = [688, 308, 1340, 720];
await crop('cosmetics', cosmeticsBox, shapeMask(smoothPath(cosmeticsOutline, cosmeticsBox), 3));
await crop('agriculture', agricultureBox, shapeMask(smoothPath(agricultureOutline, agricultureBox), 1.2));
await crop('hanging-leaves', [815, 25, 1055, 285], radialMask(.5));
// The button above the petals is masked out; the live button sits there.
const withoutButton = (w, h) => Buffer.from(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><defs><filter id='f'><feGaussianBlur stdDeviation='4'/></filter><mask id='b'><rect width='${w}' height='${h}' fill='#fff'/><rect x='80' y='-20' width='280' height='66' rx='8' fill='#000' filter='url(#f)'/></mask></defs><image href='data:image/svg+xml;base64,${edgeMask({ top: .42, right: .45 })(w, h).toString('base64')}' width='${w}' height='${h}' mask='url(#b)'/></svg>`);
await crop('petals-large', [0, 785, 620, 968], withoutButton, { clearPaper: true });
await crop('petal', [410, 685, 495, 750], radialMask(.7), { clearPaper: true });
// Botanical sprigs sit on plain paper in the mockup, so they are cut with faded inner edges.
await crop('leaves-left', [0, 128, 118, 352], edgeMask({ top: .06, right: .15 }), { clearPaper: true });
await crop('leaves-right-top', [1270, 392, 1361, 545], edgeMask({ top: .1 }), { clearPaper: true });
await crop('leaves-right-bottom', [1130, 606, 1350, 800], edgeMask({ top: .06 }), { clearPaper: true });

// ── Hero scene: leaf photograph + deep-green band, traced from the mockup and cleaned of baked-in UI.
{
  const X0 = 550, W = 811, H = 372, EXT = 195;
  const base = await sharp(source).extract({ left: X0, top: 0, width: W, height: H }).removeAlpha().png().toBuffer();
  const rel = ([x, y]) => [x - X0, y];
  // Replace a box with the area just below it, mirrored and softened, blended through a feathered mask.
  const patchFromBelow = async (img, [x0, y0, x1, y1]) => {
    const [l, t] = rel([x0, y0]), w = x1 - x0, h = y1 - y0;
    const donor = await sharp(img).extract({ left: l, top: t + h, width: w, height: h }).flip().blur(6).png().toBuffer();
    const feather = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><filter id="f"><feGaussianBlur stdDeviation="5"/></filter></defs><rect x="5" y="5" width="${w - 10}" height="${h - 10}" rx="12" fill="#fff" filter="url(#f)"/></svg>`);
    const piece = await sharp(donor).ensureAlpha().composite([{ input: feather, blend: 'dest-in' }]).png().toBuffer();
    return sharp(img).composite([{ input: piece, left: l, top: t }]).png().toBuffer();
  };
  // Soften text in place (live text is drawn over it again).
  const patchBlur = async (img, [x0, y0, x1, y1], sigma) => {
    const [l, t] = rel([x0, y0]), w = x1 - x0, h = y1 - y0;
    const soft = await sharp(img).extract({ left: l, top: t, width: w, height: h }).blur(sigma).png().toBuffer();
    const feather = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><filter id="f"><feGaussianBlur stdDeviation="6"/></filter></defs><rect x="8" y="8" width="${w - 16}" height="${h - 16}" rx="14" fill="#fff" filter="url(#f)"/></svg>`);
    const piece = await sharp(soft).ensureAlpha().composite([{ input: feather, blend: 'dest-in' }]).png().toBuffer();
    return sharp(img).composite([{ input: piece, left: l, top: t }]).png().toBuffer();
  };
  // Rebuild the copy area from the plain bokeh strip to its right, stretched across.
  const patchFromRight = async (img, [x0, y0, x1, y1], [sx0, sx1]) => {
    const [l, t] = rel([x0, y0]), w = x1 - x0, h = y1 - y0;
    const donor = await sharp(img).extract({ left: sx0 - X0, top: t, width: sx1 - sx0, height: h }).resize({ width: w, height: h, fit: 'fill' }).blur(9).png().toBuffer();
    const feather = Buffer.from(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><defs><filter id='f'><feGaussianBlur stdDeviation='7'/></filter></defs><rect x='10' y='10' width='${w - 20}' height='${h - 20}' rx='18' fill='#fff' filter='url(#f)'/></svg>`);
    const piece = await sharp(donor).ensureAlpha().composite([{ input: feather, blend: 'dest-in' }]).png().toBuffer();
    return sharp(img).composite([{ input: piece, left: l, top: t }]).png().toBuffer();
  };
  // Smear a thin strip of plain bokeh across a box (the background there is out of focus, so this reads as more bokeh).
  const patchStretch = async (img, [x0, y0, x1, y1], from) => {
    const [l, t] = rel([x0, y0]), w = x1 - x0, h = y1 - y0;
    const src = from === 'below' ? { left: l, top: t + h, width: w, height: 8 } : { left: l + w, top: t, width: 8, height: h };
    const donor = await sharp(img).extract(src).resize({ width: w, height: h, fit: 'fill' }).blur(12).png().toBuffer();
    const feather = Buffer.from(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><defs><filter id='f'><feGaussianBlur stdDeviation='5'/></filter></defs><rect x='4' y='4' width='${w - 8}' height='${h - 8}' rx='16' fill='#fff' filter='url(#f)'/></svg>`);
    const piece = await sharp(donor).ensureAlpha().composite([{ input: feather, blend: 'dest-in' }]).png().toBuffer();
    return sharp(img).composite([{ input: piece, left: l, top: t }]).png().toBuffer();
  };
  let img = await patchStretch(base, [1016, 0, 1310, 74], 'below');    // 化粧品サイトへ button + menu
  img = await patchStretch(img, [1140, 190, 1310, 310], 'right');      // three-line copy
  // Extend to the right with a mirrored, blurred strip so wide screens never show an edge.
  const strip = await sharp(img).extract({ left: W - EXT - 60, top: 0, width: EXT + 60, height: H }).flop().blur(26).png().toBuffer();
  // Cross-fade the seam over 60px so the extension has no visible edge.
  const seam = Buffer.from(`<svg xmlns='http://www.w3.org/2000/svg' width='${EXT + 60}' height='${H}'><defs><linearGradient id='g'><stop offset='0' stop-color='#fff' stop-opacity='0'/><stop offset='.24' stop-color='#fff'/></linearGradient></defs><rect width='${EXT + 60}' height='${H}' fill='url(#g)'/></svg>`);
  const stripSoft = await sharp(strip).ensureAlpha().composite([{ input: seam, blend: 'dest-in' }]).png().toBuffer();
  const tail = await sharp(img).extract({ left: W - 1, top: 0, width: 1, height: H }).resize({ width: EXT, height: H, fit: 'fill' }).blur(4).png().toBuffer();
  const wide = await sharp({ create: { width: W + EXT, height: H, channels: 3, background: '#1d4331' } })
    .composite([{ input: img, left: 0, top: 0 }, { input: stripSoft, left: W - 60, top: 0 }]).png().toBuffer();

  const diagonal = [[985,0],[955,20],[935,40],[893,60],[868,80],[843,100],[818,125],[792,150],[767,175],[741,200],[712,225],[682,250],[652,272],[621,290],[598,302],[575,313],[558,321]];
  const lower = [[575,327],[610,331],[645,337],[680,349],[705,372],[760,372],[800,362],[840,353],[880,346],[920,342],[960,340],[1000,342],[1040,328],[1080,337],[1120,349],[1160,357],[1200,363],[1240,362],[1280,353],[1320,338],[1340,328],[1361,315],[1450,300],[1556,290]];
  const pts = [[1556,0], ...diagonal, ...lower].map(rel);
  const d = 'M' + pts.map(p => p.join(' ')).join(' L') + 'Z';
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W + EXT}" height="${H}"><defs>
    <filter id="f"><feGaussianBlur stdDeviation="1.6"/></filter>
    <linearGradient id="ribbon" x1="0" x2="1"><stop offset="0" stop-color="#000"/><stop offset=".13" stop-color="#fff"/></linearGradient>
    <mask id="m"><rect width="${W + EXT}" height="${H}" fill="url(#ribbon)"/></mask></defs>
    <g mask="url(#m)"><path d="${d}" fill="#fff" filter="url(#f)"/></g></svg>`);
  const cut = await sharp(wide).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  const big = await sharp(cut).resize({ width: (W + EXT) * 2, kernel: 'lanczos3' }).sharpen({ sigma: .7 }).png().toBuffer();
  await sharp(big).webp({ quality: 86, alphaQuality: 90 }).toFile(`${out}scene.webp`);
  await sharp(big).resize({ width: 800 }).webp({ quality: 84, alphaQuality: 90 }).toFile(`${out}scene-800.webp`);
  console.log(`${out}scene.webp ${(W + EXT) * 2}x${H * 2}`);
}
