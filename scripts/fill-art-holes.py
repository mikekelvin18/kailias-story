#!/usr/bin/env python3
"""Fill see-through holes inside character art.

The run-cycle frames (public/characters/{kailia,noel}/run-*.png and their
painted copies) had their white areas cut out along with the white
background, so Noel's head and belly and Kailia's dress showed the game
floor through them. In a game Noel looked like a ghost while running and
Kailia's dress flickered as the holes changed shape from frame to frame.

This fills every transparent pixel that the drawing surrounds with the
art's warm white, and leaves the real background alone:

  * a pixel is "inside" when the drawing (with small outline gaps closed)
    is found to its left, right and below, and above it (straight up, or
    on both upward diagonals);
  * --head X: also fills the convex outline of the head (everything above
    the cape, right of X × width). Noel's head in run-1/run-2 is drawn
    with almost no outline at the top, so nothing else can tell it apart
    from the sky.

    python3 scripts/fill-art-holes.py in.png [out.png] [--head 0.33]

Needs Python 3 with Pillow + numpy.
"""
import sys

import numpy as np
from PIL import Image, ImageDraw

WHITE = np.array((250, 247, 242), np.float32)   # the drawings' warm white
CLOSE = 5                                       # outline gaps up to this many px are bridged


def dilate(m: np.ndarray, r: int) -> np.ndarray:
    o = m.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy <= r * r:
                o |= np.roll(np.roll(m, dy, 0), dx, 1)
    return o


def enclosed(solid: np.ndarray) -> np.ndarray:
    p = CLOSE + 1
    padded = np.pad(solid, p)
    s = (~dilate(~dilate(padded, CLOSE), CLOSE))[p:-p, p:-p] | solid
    # a drawing cropped by the top edge is closed along that stretch
    top = np.nonzero(solid[:3].any(0))[0]
    if len(top):
        s[0, top.min():top.max() + 1] = True
    left = np.maximum.accumulate(s, 1)
    right = np.maximum.accumulate(s[:, ::-1], 1)[:, ::-1]
    up = np.maximum.accumulate(s, 0)
    down = np.maximum.accumulate(s[::-1], 0)[::-1]
    up_l, up_r = s.copy(), s.copy()
    for y in range(1, s.shape[0]):
        up_l[y, 1:] |= up_l[y - 1, :-1]
        up_r[y, :-1] |= up_r[y - 1, 1:]
    return left & right & down & (up | (up_l & up_r)) & ~solid


def convex(points):
    pts = sorted(set(points))
    def cross(o, a, b): return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo, hi = [], []
    for p in pts:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p) <= 0: lo.pop()
        lo.append(p)
    for p in reversed(pts):
        while len(hi) >= 2 and cross(hi[-2], hi[-1], p) <= 0: hi.pop()
        hi.append(p)
    return lo[:-1] + hi[:-1]


def head_area(a: np.ndarray, solid: np.ndarray, from_x: float) -> np.ndarray:
    h, w = solid.shape
    r, g, b = (a[..., i].astype(int) for i in range(3))
    purple = solid & (b > r + 25) & (b > g + 25)
    rows = np.nonzero(purple.any(1))[0]
    if not len(rows):
        return np.zeros_like(solid)
    cape_top = int(rows.min())
    head = solid.copy()
    head[cape_top:] = False
    head[:, :int(w * from_x)] = False
    ys, xs = np.nonzero(head)
    if len(ys) < 3:
        return np.zeros_like(solid)
    m = Image.new('L', (w, h), 0)
    ImageDraw.Draw(m).polygon([(int(x), int(y)) for y, x in convex(list(zip(ys, xs)))], fill=255)
    out = np.array(m) > 0
    out[cape_top:] = False
    return out


def fill(path_in: str, path_out: str, head) -> None:
    a = np.array(Image.open(path_in).convert('RGBA'))
    solid = a[..., 3] > 128
    inside = enclosed(solid)
    if head is not None:
        inside |= head_area(a, solid, head)
    hole = inside & (a[..., 3] < 255)
    alpha = a[..., 3:].astype(np.float32) / 255
    a[..., :3] = np.where(hole[..., None], a[..., :3] * alpha + WHITE * (1 - alpha), a[..., :3]).astype(np.uint8)
    a[..., 3] = np.where(hole, 255, a[..., 3])
    Image.fromarray(a).save(path_out)
    print(f'{path_in} -> {path_out}: filled {int(hole.sum())} px')


if __name__ == '__main__':
    args = sys.argv[1:]
    head = None
    if '--head' in args:
        i = args.index('--head')
        head = float(args[i + 1])
        del args[i:i + 2]
    fill(args[0], args[1] if len(args) > 1 else args[0], head)
