import { ScrollTrigger } from '../scroll/smooth';
import { PLANET, RING, coverMap } from './geometry';

/**
 * The hero planet rotates. The painted disc is split offline (scripts/planet-textures.py) into a surface-detail
 * texture (albedo, equirectangular) and a static lighting map; this shader draws albedo(rotated) x light(static) over
 * the painted disc, so at t = 0 it matches the picture and then only the surface drifts. The near-side ring band is
 * left transparent so the painted ring keeps passing in front of the planet. Plain WebGL 1, one quad, no library.
 */
const PERIOD = 110;          // seconds per revolution
const FPS_CAP = 30;
const TILT_Z = 20.35 * Math.PI / 180;         // pole leans left of vertical (view coords, y up)
const ELEV = Math.asin(RING.b / RING.a);       // we look ~7.6 deg above the ring plane

const VERT = `attribute vec2 a;varying vec2 v;void main(){v=vec2(a.x*.5+.5,.5-a.y*.5);gl_Position=vec4(a,0.,1.);}`;
const FRAG = `precision highp float;varying vec2 v;
uniform sampler2D uA,uL;uniform mat3 uR;uniform float uAng,uPx;
uniform vec2 uDisc,uRingC,uRingAB,uRingCS;uniform float uRadius,uInner;
const float PI=3.14159265;
void main(){
  vec2 p=v*2.-1.;float d=length(p);
  float edge=1.-smoothstep(1.-2.*uPx,1.,d);if(edge<=0.)discard;
  float z=sqrt(max(1.-d*d,0.));
  vec3 q=uR*vec3(p.x,-p.y,z);
  float lat=asin(clamp(q.y,-1.,1.));
  float lon=atan(q.x,q.z)-uAng;
  float m=mod(lon+PI*.5,PI*2.);float lf=m<PI?m-PI*.5:PI*1.5-m;
  vec3 a=texture2D(uA,vec2((lf+PI*.5)/PI,(lat+PI*.5)/PI)).rgb*2.;
  vec3 L=texture2D(uL,v).rgb;
  vec3 col=clamp(a*L,0.,1.);
  vec2 ip=uDisc+p*uRadius-uRingC;
  float lu=ip.x*uRingCS.x+ip.y*uRingCS.y;float lv=-ip.x*uRingCS.y+ip.y*uRingCS.x;
  float re=sqrt((lu*lu)/(uRingAB.x*uRingAB.x)+(lv*lv)/(uRingAB.y*uRingAB.y));
  float band=lv>0.?smoothstep(uInner-.05,uInner-.015,re)*(1.-smoothstep(1.01,1.05,re)):0.;
  float alpha=edge*(1.-band);
  gl_FragColor=vec4(col*alpha,alpha);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
}

export function setupPlanet(): void {
  const section = document.getElementById('hero');
  const art = section?.querySelector<HTMLElement>('.hero__art');
  const img = art?.querySelector<HTMLImageElement>('img');
  if (!section || !art || !img) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'hero__planet';
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) return;
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (name: string) => gl.getUniformLocation(prog, name);

  // planet -> view rotation R = Rz(tilt) * Rx(elev); the shader needs R^T (view -> planet). GLSL mat3 is column-major,
  // so handing it R's rows as columns yields R^T.
  const cz = Math.cos(TILT_Z), sz = Math.sin(TILT_Z), cb = Math.cos(ELEV), sb = Math.sin(ELEV);
  gl.uniformMatrix3fv(u('uR'), false, new Float32Array([cz, -sz * cb, -sz * sb, sz, cz * cb, cz * sb, 0, -sb, cb]));
  gl.uniform2f(u('uDisc'), PLANET.cx, PLANET.cy);
  gl.uniform1f(u('uRadius'), PLANET.r);
  gl.uniform2f(u('uRingC'), RING.cx, RING.cy);
  gl.uniform2f(u('uRingAB'), RING.a, RING.b);
  gl.uniform2f(u('uRingCS'), Math.cos(RING.tilt), Math.sin(RING.tilt));
  gl.uniform1f(u('uInner'), RING.inner);
  gl.uniform1i(u('uA'), 0);
  gl.uniform1i(u('uL'), 1);
  const uAng = u('uAng');
  const uPx = u('uPx');

  const texture = (unit: number, im: HTMLImageElement, wrapS: number) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };

  /* place the canvas over the painted disc, in the art's coordinate space */
  const dpr = Math.min(window.devicePixelRatio || 1, matchMedia('(max-width: 767px)').matches ? 1.25 : 1.5);
  const place = () => {
    const { scale, ox, oy } = coverMap(art, img);
    const size = 2 * PLANET.r * scale;
    canvas.style.left = `${(ox + (PLANET.cx - PLANET.r) * scale).toFixed(2)}px`;
    canvas.style.top = `${(oy + (PLANET.cy - PLANET.r) * scale).toFixed(2)}px`;
    canvas.style.width = canvas.style.height = `${size.toFixed(2)}px`;
    const px = Math.max(1, Math.round(size * dpr));
    if (canvas.width !== px) { canvas.width = canvas.height = px; gl.viewport(0, 0, px, px); gl.uniform1f(uPx, 1 / px); }
  };

  let active = false;
  let raf = 0;
  let last = 0;
  const t0 = performance.now();
  const frame = (now: number) => {
    raf = active ? requestAnimationFrame(frame) : 0;
    if (now - last < 1000 / FPS_CAP) return;
    last = now;
    gl.uniform1f(uAng, ((now - t0) / 1000 / PERIOD) * Math.PI * 2);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const run = (on: boolean) => {
    on = on && !document.hidden;
    if (on === active) return;
    active = on;
    if (active && !raf) raf = requestAnimationFrame(frame);
  };

  Promise.all([loadImage('./images/planet-albedo.webp'), loadImage('./images/planet-light.webp')]).then(([albedo, light]) => {
    texture(0, albedo, gl.CLAMP_TO_EDGE);
    texture(1, light, gl.CLAMP_TO_EDGE);
    gl.clearColor(0, 0, 0, 0);
    place();
    img.insertAdjacentElement('afterend', canvas); // above the picture, below the star / ring layers
    new ResizeObserver(place).observe(art);
    canvas.addEventListener('webglcontextlost', () => { run(false); canvas.remove(); });
    let visible = true;
    const inRange = (self: ScrollTrigger) => self.end > 0 && self.scroll() >= self.start && self.scroll() <= self.end;
    const trigger = ScrollTrigger.create({ trigger: section, start: 'top bottom', end: 'bottom top', onToggle: (self) => { visible = self.isActive; run(visible); }, onRefresh: (self) => { visible = inRange(self); run(visible); } });
    visible = inRange(trigger);
    document.addEventListener('visibilitychange', () => run(visible));
    run(visible);
  }).catch(() => { /* textures unavailable: the painted planet stays */ });
}
