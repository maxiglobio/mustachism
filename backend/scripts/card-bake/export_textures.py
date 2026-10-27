"""
Turn the Blender bakes into web textures in public/assets/card/.

  front_normal.png / back_normal.png  4096x2592 tangent-space normals
  front_ao.png / back_ao.png          2048x1296 ambient occlusion
  front_height.png / back_height.png  4096x2592 object-space Z → "ink" mask (raised = inked)

Writes full-detail sets (2k + 4k normals) and "blank" sets where the personal fields are
flattened so the browser can re-engrave them (see src/components/card3d/engraver.ts —
the rectangles below must match FIELDS / PHOTO there).
"""
import subprocess, sys, os
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
FLAT = (128, 128, 255)

# 4096x2592 coordinates
FRONT_RECTS = [
    (2370, 120, 3110, 290),   # number
    (1500, 595, 3790, 770),   # name
    (1500, 1045, 1710, 1220), # sex
    (1860, 1045, 3110, 1220), # dob
    (1500, 1470, 2610, 1665), # issue date
    (3370, 2225, 3690, 2535), # class letter
    (32, 440, 1495, 2075),    # photo + frame (keeps the card's left edge bevel)
]
BACK_RECTS = [(340, 2190, 1345, 2470)]  # number on the reverse

def webp(img, path, q=90, lossless=False):
    tmp = path + '.png'
    img.save(tmp)
    args = ['cwebp', '-quiet', '-m', '6', '-mt']
    args += ['-lossless'] if lossless else ['-q', str(q), '-sharp_yuv']
    subprocess.run(args + [tmp, '-o', path], check=True)
    os.remove(tmp)
    print(f'{os.path.basename(path):28s} {img.size[0]}x{img.size[1]}  {os.path.getsize(path)/1024:.0f} KB')

def blank(img, rects, fill, scale):
    img = img.copy()
    for x0, y0, x1, y1 in rects:
        box = tuple(int(round(v * scale)) for v in (x0, y0, x1, y1))
        img.paste(fill, box)
    return img

import numpy as np

def ink_mask(side):
    h = np.asarray(Image.open(f'{SRC}/{side}_height.png').convert('L')).astype(int)
    # Plate sits at 213 (front) / 43 (back); raised features are inked black.
    m = (h >= 217) & (h <= 250) if side == 'front' else (h > 0) & (h <= 38)
    return Image.fromarray(np.where(m, 0, 255).astype(np.uint8))

for side, rects in (('front', FRONT_RECTS), ('back', BACK_RECTS)):
    ink4 = ink_mask(side)
    ink2 = ink4.resize((2048, 1296), Image.LANCZOS)
    webp(ink2, f'{OUT}/{side}-ink-2k.webp', q=90)
    webp(blank(ink2, rects, 255, 0.5), f'{OUT}/{side}-ink-blank.webp', q=90)

    n4 = Image.open(f'{SRC}/{side}_normal.png').convert('RGB')
    ao = Image.open(f'{SRC}/{side}_ao.png').convert('L')
    n2 = n4.resize((2048, 1296), Image.LANCZOS)
    webp(n4, f'{OUT}/{side}-normal-4k.webp', q=92)
    webp(n2, f'{OUT}/{side}-normal-2k.webp', q=92)
    webp(ao, f'{OUT}/{side}-ao-2k.webp', q=88)
    webp(blank(n2, rects, FLAT, 0.5), f'{OUT}/{side}-normal-blank.webp', q=92)
    webp(blank(ao, rects, 255, 0.5), f'{OUT}/{side}-ao-blank.webp', q=88)
