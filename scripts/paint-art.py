"""Stroke-based painterly renderer (Hertzmann-style) for transparent PNG art.
Paints the image with thousands of small oriented brush strokes, each one
following the image's local edge direction, then restores the crisp ink
linework on top so faces stay readable at small sizes."""
import sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def box_blur(a, r):
    if r < 1: return a
    k = 2*r+1
    p = np.pad(a, [(r,r),(r,r)] + [(0,0)]*(a.ndim-2), mode='edge')
    c = p.cumsum(0); c = np.concatenate([np.zeros_like(c[:1]), c], 0)
    a1 = (c[k:] - c[:-k]) / k
    c = a1.cumsum(1); c = np.concatenate([np.zeros_like(c[:, :1]), c], 1)
    return (c[:, k:] - c[:, :-k]) / k

def paint(src, dst, seed=7, strength=1.0):
    random.seed(seed); np.random.seed(seed)
    im = Image.open(src).convert('RGBA')
    W0, H0 = im.size
    # small sprites (run/jump frames) are painted at a higher internal
    # resolution so the brush strokes stay fine enough to keep the face
    scale = 2 if max(W0, H0) >= 400 else 4
    B = max(2.5, max(W0, H0) / 85)  # base brush size, relative to the art
    im = im.resize((W0*scale, H0*scale), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    rgb, alpha = a[..., :3], a[..., 3]
    H, W = alpha.shape
    # bleed edge colours outward so strokes near the silhouette never pick
    # up the white of the transparent background (avoids a pale halo)
    w = (alpha/255.0)
    num = rgb*w[...,None]; den = w.copy()
    filled = rgb.copy()
    for r in (2, 4, 8, 16):
        n = np.stack([box_blur(num[...,i], r) for i in range(3)], -1); d = box_blur(den, r)
        est = n/np.maximum(d,1e-4)[...,None]
        m = (den < 0.98) & (d > 0.02)
        filled = np.where(m[...,None] & (w[...,None] < 0.98), est*(1-w[...,None]) + rgb*w[...,None], filled)
        den = np.maximum(den, (d>0.02)*0.99)
    rgb = np.where(w[...,None] < 0.98, filled, rgb)
    lum = rgb @ np.array([0.299, 0.587, 0.114], np.float32)
    canvas = Image.new('RGB', (W, H), (255, 255, 255))
    # base: flat-ish blurred colour so no white gaps show between strokes
    base = np.stack([box_blur(rgb[..., i], int(B*scale)) for i in range(3)], -1)
    canvas.paste(Image.fromarray(base.clip(0, 255).astype(np.uint8)))
    draw = ImageDraw.Draw(canvas, 'RGBA')
    radii = [int(round(B*k*scale)) for k in (1.0, 0.57, 0.29)]
    for R in radii:
        ref = np.stack([box_blur(rgb[..., i], max(1, R//2)) for i in range(3)], -1)
        L = box_blur(lum, max(1, R//2))
        gy, gx = np.gradient(L)
        cur = np.asarray(canvas).astype(np.float32)
        diff = np.sqrt(((cur - ref) ** 2).sum(-1))
        grid = max(2, R)
        pts = []
        for y in range(0, H, grid):
            for x in range(0, W, grid):
                if alpha[y, x] < 20: continue
                y1, x1 = min(H, y+grid), min(W, x+grid)
                region = diff[y:y1, x:x1]
                if region.mean() > 12 or R == radii[0]:
                    iy, ix = np.unravel_index(region.argmax(), region.shape)
                    pts.append((x+ix, y+iy))
        random.shuffle(pts)
        for (x, y) in pts:
            col = ref[y, x]
            pts_line = [(x, y)]
            cx, cy = float(x), float(y)
            ldx, ldy = 0.0, 0.0
            for i in range(10 if R > 4 else 6):
                ix, iy = int(cx), int(cy)
                if not (0 <= ix < W and 0 <= iy < H) or alpha[iy, ix] < 20: break
                if i > 2 and np.abs(ref[iy, ix] - col).sum() > 60: break
                g = math.hypot(gx[iy, ix], gy[iy, ix])
                if g < 0.5:
                    dx, dy = (ldx, ldy) if (ldx or ldy) else (1.0, 0.3)
                else:
                    dx, dy = -gy[iy, ix]/g, gx[iy, ix]/g  # along the edge
                if ldx*dx + ldy*dy < 0: dx, dy = -dx, -dy
                if ldx or ldy:  # curvature smoothing
                    dx, dy = 0.6*dx + 0.4*ldx, 0.6*dy + 0.4*ldy
                    n = math.hypot(dx, dy) or 1; dx, dy = dx/n, dy/n
                cx, cy = cx + dx*R*0.8, cy + dy*R*0.8
                ldx, ldy = dx, dy
                pts_line.append((cx, cy))
            j = np.random.normal(0, 7, 3) * strength
            c = tuple(int(v) for v in np.clip(col + j, 0, 255)) + (230,)
            w = max(1, int(R * random.uniform(0.8, 1.15)))
            if len(pts_line) == 1:
                draw.ellipse([x-w/2, y-w/2, x+w/2, y+w/2], fill=c)
            else:
                draw.line(pts_line, fill=c, width=w, joint='curve')
                for (px, py) in (pts_line[0], pts_line[-1]):
                    draw.ellipse([px-w/2, py-w/2, px+w/2, py+w/2], fill=c)
            # bristle highlight / shadow streak inside the stroke
            if R > 3 and len(pts_line) > 2:
                sh = 18 if random.random() < .5 else -18
                c2 = tuple(int(v) for v in np.clip(col + sh, 0, 255)) + (90,)
                off = [(px + random.uniform(-1, 1), py + random.uniform(-1, 1)) for px, py in pts_line]
                draw.line(off, fill=c2, width=max(1, w//4))
    out = np.asarray(canvas).astype(np.float32)
    # restore ink: dark linework from the original drawn back over the paint
    ink = np.clip((95 - lum) / 45, 0, 1)[..., None] * 0.9
    out = out * (1 - ink) + rgb * ink
    # keep eye/face highlights crisp: very bright small specular pixels
    spec = np.clip((lum - 235) / 15, 0, 1)[..., None] * 0.6
    out = out * (1 - spec) + rgb * spec
    # brushy silhouette: slightly roughened alpha edge
    noise = np.random.rand(H, W).astype(np.float32)
    noise = box_blur(noise, 1)
    al = box_blur(alpha, 1)
    al = np.clip((al - 128) * 2.2 + (noise - .5) * 120 + 128, 0, 255)
    al = np.where(alpha > 250, 255, al)
    res = Image.fromarray(np.dstack([out.clip(0, 255), al]).astype(np.uint8), 'RGBA')
    res = res.resize((W0, H0), Image.LANCZOS)
    res.save(dst, optimize=True)

if __name__ == '__main__':
    # usage: python3 scripts/paint-art.py input.png output.png [seed]
    paint(sys.argv[1], sys.argv[2], seed=int(sys.argv[3]) if len(sys.argv) > 3 else 7)
