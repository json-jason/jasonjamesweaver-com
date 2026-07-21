#!/usr/bin/env python3
"""Author the "name shines" frames for the end of the sword-raise sequence.

When the sword reaches the sky, a single bright highlight sweeps left-to-right
across ALL the gold of the WEAVER plaque (filigree + letters), as if the raised
sword made the name sparkle. Each output frame is the apex+gleam sword pose with
the shine band at a different x; runtime plays them in order once, then holds on
the final (normal-gold) frame before entering.

Only warm gold pixels are touched. The blue gems (b > r) and black inlay stay put.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
# Base pose: sword at apex with its blade-tip gleam already present.
BASE = ROOT / "public/images/nes/title-scene/sword-raise/sword-raise-5.webp"
OUT = ROOT / "public/images/nes/title-scene/gold-sweep"

# The WEAVER plaque bounds and how far the highlight travels.
PLAQUE_BOX = (205, 24, 1262, 462)
SWEEP_START = 150
SWEEP_END = 1315
FRAMES = 8
SIGMA = 150.0
STRENGTH = 0.85
HIGHLIGHT = (255, 246, 208)  # warm near-white sparkle


def is_gold(r: int, g: int, b: int) -> bool:
    # Warm metallic gold: strong red, mid green, low blue. Excludes blue gems
    # (b > r), black inlay (all low), and the dark plaque border.
    return r > 120 and g > 75 and b < r - 35 and b < 175


def make_sweep(base: Image.Image, cx: float) -> Image.Image:
    frame = base.copy()
    fp = frame.load()
    bp = base.load()
    x0, y0, x1, y1 = PLAQUE_BOX
    inv_two_sigma_sq = 1.0 / (2.0 * SIGMA * SIGMA)
    for x in range(x0, x1):
        intensity = math.exp(-((x - cx) ** 2) * inv_two_sigma_sq) * STRENGTH
        if intensity < 0.02:
            continue
        for y in range(y0, y1):
            r, g, b, a = bp[x, y]
            if not is_gold(r, g, b):
                continue
            fp[x, y] = (
                round(r + (HIGHLIGHT[0] - r) * intensity),
                round(g + (HIGHLIGHT[1] - g) * intensity),
                round(b + (HIGHLIGHT[2] - b) * intensity),
                a,
            )
    return frame


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    base = Image.open(BASE).convert("RGBA")
    for i in range(FRAMES):
        t = i / (FRAMES - 1)
        cx = SWEEP_START + (SWEEP_END - SWEEP_START) * t
        make_sweep(base, cx).convert("RGB").save(
            OUT / f"gold-sweep-{i}.webp", format="WEBP", quality=80, method=6
        )
    print(f"Built {FRAMES} gold-sweep frames in {OUT}")


if __name__ == "__main__":
    main()
