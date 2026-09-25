#!/usr/bin/env python3
"""Bake the CSS filters that used to sit on the two background images into the pixels.

  .universe > img   brightness(1.16) saturate(1.04)   -> public/images/starfield.webp
  .hero__art img    brightness(1.22) saturate(1.04)   -> public/images/cosmic-hero.webp

Both layers now move with scroll (parallax). A CSS filter on a moving layer is re-composited every frame,
so the same look is produced once here instead. Filter maths follow the Filter Effects spec (sRGB,
brightness = linear scale, saturate = colour matrix), clamped after each step.

Usage: python3 scripts/bake-filters.py <src-dir-with-original-webps> [quality=90]
"""
import sys, os
import numpy as np
from PIL import Image

src_dir = sys.argv[1]
quality = int(sys.argv[2]) if len(sys.argv) > 2 else 90
out_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'images')
JOBS = {'starfield.webp': (1.16, 1.04), 'cosmic-hero.webp': (1.22, 1.04)}

def saturate_matrix(s):
    return np.array([
        [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s],
        [0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s],
        [0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s],
    ])

for name, (brightness, saturation) in JOBS.items():
    im = Image.open(os.path.join(src_dir, name)).convert('RGB')
    px = np.asarray(im).astype(np.float64) / 255.0
    px = np.clip(px * brightness, 0.0, 1.0)
    px = np.clip(px @ saturate_matrix(saturation).T, 0.0, 1.0)
    out = Image.fromarray(np.round(px * 255.0).astype(np.uint8), 'RGB')
    dst = os.path.join(out_dir, name)
    out.save(dst, 'WEBP', quality=quality, method=6)
    print(f'{name}: {im.size[0]}x{im.size[1]}  {os.path.getsize(os.path.join(src_dir, name))//1024} kB -> {os.path.getsize(dst)//1024} kB  (brightness {brightness}, saturate {saturation}, q{quality})')
