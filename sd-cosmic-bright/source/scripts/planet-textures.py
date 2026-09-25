#!/usr/bin/env python3
"""Split the painted hero planet into a rotating albedo texture and a static lighting map.

Input : public/images/cosmic-hero.webp (the baked hero picture, 1672x941)
Output: public/images/planet-albedo.webp  equirect detail texture, lon -45..45 deg (mirrored to 360 in the shader), lat -90..90
        public/images/planet-light.webp   low-frequency lighting of the painted disc, in disc coordinates (static in the shader)

albedo = painting / blur(painting); light = blur(painting). The shader draws albedo(rotated) * light(static), so at t=0 the
result equals the painting and only the surface detail moves. Geometry constants must match src/motion/hero.ts.
"""
import os, sys, math
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'public', 'images', 'cosmic-hero.webp')
OUT = os.path.join(HERE, '..', 'public', 'images')
PLANET = dict(cx=1232, cy=432, r=340)
RING = dict(cx=1435, cy=366, a=758, b=100, tilt=math.radians(-20.35), inner=0.90)
TILT_Z = math.radians(20.35)   # pole leans left of vertical (view coords, y up)
ELEV = math.asin(RING['b'] / RING['a'])  # we look ~7.6 deg above the ring plane: north pole leans toward the viewer
LON_HALF = 90.0                # the whole visible hemisphere; the shader mirrors it for the far side (360 deg period)
TEX_W, TEX_H = 1024, 768       # longitude x latitude texels of the albedo map
TEX = 512                      # lighting map (disc coordinates)
BLUR = 26                      # px, lighting scale

def rot_matrix():
    cz, sz = math.cos(TILT_Z), math.sin(TILT_Z)
    cb, sb = math.cos(ELEV), math.sin(ELEV)
    Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])          # tilt in the screen plane
    Rx = np.array([[1, 0, 0], [0, cb, sb], [0, -sb, cb]])           # pole toward the viewer (+z)
    return Rz @ Rx                                                  # planet -> view

def main():
    im = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float64) / 255.0
    cx, cy, r = PLANET['cx'], PLANET['cy'], PLANET['r']
    size = 2 * r
    disc = im[cy - r:cy + r, cx - r:cx + r]                          # (size, size, 3)
    yy, xx = np.mgrid[0:size, 0:size]
    u = (xx + 0.5 - r) / r; v = (yy + 0.5 - r) / r                   # disc coords, v down
    inside = (u * u + v * v) <= 1.0

    # ring band (near side) in image px -> mask it out of the albedo
    px = xx + cx - r + 0.5; py = yy + cy - r + 0.5
    ct, st = math.cos(RING['tilt']), math.sin(RING['tilt'])
    dx, dy = px - RING['cx'], py - RING['cy']
    lu = dx * ct + dy * st; lv = -dx * st + dy * ct
    re = np.sqrt((lu / RING['a']) ** 2 + (lv / RING['b']) ** 2)
    band = (lv > 0) & (re > RING['inner'] - 0.03) & (re < 1.04)

    # normalized (mask-aware) blur = lighting; albedo = painting / lighting
    mask = inside.astype(np.float64)
    def blur(a):
        # gaussian blur via FFT (zero padded), float precision matters for the dark planet colours
        pad = 3 * BLUR
        ap = np.pad(a, pad)
        h, w = ap.shape
        fy = np.fft.fftfreq(h)[:, None]; fx = np.fft.rfftfreq(w)[None, :]
        g = np.exp(-2 * (math.pi ** 2) * (BLUR ** 2) * (fx ** 2 + fy ** 2))
        out = np.fft.irfft2(np.fft.rfft2(ap) * g, s=(h, w))
        return out[pad:pad + a.shape[0], pad:pad + a.shape[1]]
    light = np.zeros_like(disc)
    wsum = blur(mask)
    for c in range(3):
        light[..., c] = blur(disc[..., c] * mask) / np.maximum(wsum, 1e-3)
    albedo = disc / np.maximum(light, 0.02)
    albedo = np.clip(albedo, 0.0, 2.0)

    # equirect albedo: lon in [-LON_HALF, LON_HALF], lat in [-90, 90]; sample the disc through the tilt
    R = rot_matrix()
    j, i = np.mgrid[0:TEX_H, 0:TEX_W]
    lon = np.radians(-LON_HALF + 2 * LON_HALF * (i + 0.5) / TEX_W)
    lat = np.radians(-90 + 180 * (j + 0.5) / TEX_H)
    n_planet = np.stack([np.cos(lat) * np.sin(lon), np.sin(lat), np.cos(lat) * np.cos(lon)], -1)
    n_view = n_planet @ R.T
    su = n_view[..., 0]; sv = -n_view[..., 1]; sz = n_view[..., 2]
    fx = np.clip((su + 1) * 0.5 * size - 0.5, 0, size - 1); fy = np.clip((sv + 1) * 0.5 * size - 0.5, 0, size - 1)
    x0 = np.floor(fx).astype(int); y0 = np.floor(fy).astype(int); x1 = np.minimum(x0 + 1, size - 1); y1 = np.minimum(y0 + 1, size - 1)
    wx = fx - x0; wy = fy - y0
    def sample(a):
        return (a[y0, x0] * ((1 - wx) * (1 - wy))[..., None] + a[y0, x1] * (wx * (1 - wy))[..., None]
                + a[y1, x0] * ((1 - wx) * wy)[..., None] + a[y1, x1] * (wx * wy)[..., None])
    tex = sample(albedo)
    valid = (sz > 0.08) & ~band[y0, x0] & ~band[y1, x1] & inside[y0, x0] & inside[y1, x1]
    # fill invalid texels (ring band, limb) per longitude column: blend of the texture reflected from above and from
    # below the gap, so the swirl statistics continue instead of smearing into vertical streaks
    for col in range(TEX_W):
        good = valid[:, col]
        if good.all():
            continue
        if not good.any():
            tex[:, col] = 1.0
            continue
        j = 0
        while j < TEX_H:
            if good[j]:
                j += 1
                continue
            k = j
            while k < TEX_H and not good[k]:
                k += 1
            n = k - j
            above = tex[j - 1 - np.minimum(np.arange(n), max(j - 1, 0)), col] if j > 0 else None
            below = tex[np.minimum(k + np.arange(n), TEX_H - 1), col] if k < TEX_H else None
            if above is None:
                fill = below[::-1]
            elif below is None:
                fill = above
            else:
                w = ((np.arange(n) + 0.5) / n)[:, None]
                fill = above * (1 - w) + below[::-1] * w
            tex[j:k, col] = fill
            j = k
    # beyond +-65 deg the picture is foreshortened and carries the baked rim light, which would come round as a bright
    # stripe; replace that zone with the texture reflected about +-65 deg (continuous, keeps the swirl statistics)
    LIM = 65.0
    deg = np.degrees(lon[0])
    cols = np.arange(TEX_W)
    def col_of(d):
        return np.clip(np.round((d + LON_HALF) / (2 * LON_HALF) * TEX_W - 0.5).astype(int), 0, TEX_W - 1)
    src = np.where(deg > LIM, col_of(2 * LIM - deg), np.where(deg < -LIM, col_of(-2 * LIM - deg), cols))
    tex = tex[:, src]
    Image.fromarray(np.round(np.clip(tex / 2.0, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, 'planet-albedo.webp'), 'WEBP', quality=86, method=6)

    # lighting map in disc coordinates (TEX x TEX), outside the disc: edge-extended by the normalized blur
    Image.fromarray(np.round(np.clip(light, 0, 1) * 255).astype(np.uint8)).resize((TEX, TEX), Image.LANCZOS).save(os.path.join(OUT, 'planet-light.webp'), 'WEBP', quality=88, method=6)
    np.save(os.path.join(HERE, 'planet-debug.npy'), {'albedo': tex, 'light': light, 'disc': disc, 'band': band, 'inside': inside}, allow_pickle=True)
    for n in ('planet-albedo.webp', 'planet-light.webp'):
        print(n, os.path.getsize(os.path.join(OUT, n)) // 1024, 'kB')
    print('R =', np.round(R, 4).tolist())

if __name__ == '__main__':
    main()
