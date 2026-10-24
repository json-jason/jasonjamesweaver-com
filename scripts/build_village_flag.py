#!/usr/bin/env python3
"""Make the castle pennant ripple.

The title screen tried this once and had to give up: its flag was a dozen
pixels of navy against a purple sky, close enough in hue and brightness that
any attempt to push the pixels around mangled the shape. The note is still in
build_title_ambient.py.

Two things are different here. The redrawn village gives the flag about sixty
pixels of width instead of a dozen, and the separation is not close at all -
the pennant runs (0,29,108) to (0,40,133) against a sky of (1,112,238), so
green alone tells them apart with room to spare. A flag this size, cleanly
separable, can be waved properly.

The wave is the real thing rather than a brightness trick: each column of
cloth is lifted or dropped by a whole number of pixels, by an amount that is
zero at the mast and grows towards the tip, with the crest travelling outward
along the flag. The mast, its finial and everything else in the patch are
copied across untouched.

Output: public/images/nes/village-scene/flag-*.webp, and its placement in
app/data/village-glows.json, where it rides the same frame-loop component as
the forge and the lanterns.
"""

from __future__ import annotations

import json
import math
from collections import Counter
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/images/nes/village.webp"
OUT = ROOT / "public/images/nes/village-scene"
MANIFEST = ROOT / "app/data/village-glows.json"

FIELD_W = 1448
FIELD_H = 1086

# The patch rebuilt each frame. Wide enough to hold the flag and the mast,
# tall enough that the cloth can swing without touching the edges.
BOX = (826, 250, 902, 312)

# Columns up to here are the mast and its finial: structure, not cloth, so
# they are copied straight through and never moved.
MAST_END = 840

FRAMES = 10
FRAME_MS = 115

# How far the tip of the flag swings, in field pixels. Whole pixels only -
# the cloth is pixel art and a fractional shift would resample it to mush.
TIP_SWING = 4.0

# Crests across the length of the flag. A little over one, so the cloth has a
# single travelling fold rather than a ripple pattern that reads as noise.
CRESTS = 1.25


def is_sky(r: int, g: int, b: int) -> bool:
    return b > 150 and b > r + 40 and g > r


def is_cloth(r: int, g: int, b: int) -> bool:
    """The pennant: deep navy. The sky it hangs against is far greener."""
    return g < 70 and b > 60 and b > g


def main() -> None:
    with Image.open(SOURCE) as art:
        if art.size != (FIELD_W, FIELD_H):
            raise SystemExit(f"Expected village art at {FIELD_W}x{FIELD_H}, found {art.size}")
        source = art.convert("RGB")

    px = source.load()
    x0, y0, x1, y1 = BOX
    w, h = x1 - x0, y1 - y0

    sky_row = {}
    for y in range(y0, y1):
        counts = Counter(px[x, y] for x in range(FIELD_W) if is_sky(*px[x, y]))
        sky_row[y] = counts.most_common(1)[0][0]

    # The cloth, column by column, so each column can be moved as a unit.
    cloth = {}
    for x in range(MAST_END, x1):
        column = [y for y in range(y0, y1) if is_cloth(*px[x, y])]
        if column:
            cloth[x] = column
    if not cloth:
        raise SystemExit(f"found no pennant in {BOX} - has the artwork changed?")

    tip = max(cloth)
    span = tip - MAST_END
    print(f"pennant: x {min(cloth)}..{tip}, {sum(len(c) for c in cloth.values())} cloth px")

    frames = []
    for i in range(FRAMES):
        phase = 2 * math.pi * i / FRAMES
        frame = source.crop(BOX).convert("RGB")
        fp = frame.load()

        # Clear the cloth away, then put it back displaced. Clearing first
        # matters: a column that moves down must leave sky behind it, not a
        # smear of its old self.
        for x, column in cloth.items():
            for y in column:
                fp[x - x0, y - y0] = sky_row[y]

        for x, column in cloth.items():
            reach = (x - MAST_END) / span  # 0 at the mast, 1 at the tip
            shift = round(TIP_SWING * reach * math.sin(phase - reach * CRESTS * 2 * math.pi))
            for y in column:
                ny = y + shift
                if y0 <= ny < y1:
                    fp[x - x0, ny - y0] = px[x, y]

        # Same invariant as every other patch: nothing on the border may
        # change, or the rectangle shows as a seam switching on and off.
        base = source.crop(BOX).load()
        for yy in range(h):
            for xx in range(w):
                if xx in (0, w - 1) or yy in (0, h - 1):
                    if fp[xx, yy] != base[xx, yy]:
                        raise SystemExit(
                            f"frame {i}: the flag reaches the border at ({xx},{yy}); widen BOX"
                        )
        frames.append(frame)

    OUT.mkdir(parents=True, exist_ok=True)
    for i, frame in enumerate(frames):
        frame.save(OUT / f"flag-{i}.webp", format="WEBP", lossless=True, method=6)

    entry = {
        "name": "flag",
        "frames": FRAMES,
        "frameMs": FRAME_MS,
        "box": {
            "left": f"{x0 / FIELD_W:.4%}",
            "top": f"{y0 / FIELD_H:.4%}",
            "width": f"{w / FIELD_W:.4%}",
            "height": f"{h / FIELD_H:.4%}",
        },
    }
    data = json.loads(MANIFEST.read_text())
    data = [g for g in data if g["name"] != "flag"] + [entry]
    MANIFEST.write_text(json.dumps(data, indent=2) + "\n")
    print(f"flag: {FRAMES} frames of {w}x{h} at ({x0},{y0}), tip swings {TIP_SWING:.0f}px")
    print(f"wrote {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
