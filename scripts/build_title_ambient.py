#!/usr/bin/env python3
"""Author a looping ambient title set: a gently shimmering river.

Only the river's blue water pixels change between frames; everything else —
including the castle flag — is copied pixel-for-pixel from the static title
screen. Runtime cross-cuts the frames (stacked opacity layers) to loop before
PRESS START. Frame 0 is the calm baseline used as the LCP image.

The castle flag is intentionally NOT animated here: its highlight pixels are
nearly indistinguishable in hue/brightness from the purple sky, so any
programmatic displacement mangles the crisp pennant. A convincing flag flutter
needs a hand-authored frame set (a few painted flag positions), the same way
the sword-raise frames were produced.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/images/nes/title-screen.webp"
OUT = ROOT / "public/images/nes/title-scene/ambient"

FRAMES = 6

# River band in the lower-left. Only blue "water" pixels inside are shimmered.
WATER_BOX = (70, 905, 330, 1072)

# The two blue gems set in the WEAVER plaque (top crest, bottom ornament).
JEWEL_BOXES = ((688, 84, 760, 154), (692, 374, 758, 440))


def is_water(r: int, g: int, b: int) -> bool:
    # Blue-dominant (excludes green trees/grass) and not too dark.
    return b > g + 6 and b >= r and b > 85


def is_jewel(r: int, g: int, b: int) -> bool:
    # Bright blue gem facet against the surrounding gold (r > b) and black inlay.
    return b > r + 18 and b > 100


def make_frame(source: Image.Image, phase: float) -> Image.Image:
    frame = source.copy()
    fp = frame.load()
    sp = source.load()
    # Traveling sparkle over the blue highlights. The temporal term advances
    # exactly one cycle across the loop so the shimmer loops seamlessly.
    x0, y0, x1, y1 = WATER_BOX
    for y in range(y0, y1):
        for x in range(x0, x1):
            r, g, b, a = sp[x, y]
            if not is_water(r, g, b):
                continue
            wave = math.sin(x * 0.16 + y * 0.11 - phase)
            if b > 150 and wave > 0.55:  # bright reflections glint brighter
                fp[x, y] = (min(255, r + 26), min(255, g + 28), min(255, b + 24), a)
            elif wave < -0.72:  # troughs dip slightly
                fp[x, y] = (max(0, r - 14), max(0, g - 12), max(0, b - 6), a)

    # Jewel glimmer: a diagonal band of light sweeps across each gem once per
    # loop (seamless), brightening facets toward a white-blue sparkle.
    for jx0, jy0, jx1, jy1 in JEWEL_BOXES:
        for y in range(jy0, jy1):
            for x in range(jx0, jx1):
                r, g, b, a = sp[x, y]
                if not is_jewel(r, g, b):
                    continue
                wave = math.sin((x + y) * 0.14 - phase)
                if wave > 0.55:  # facet catches the light
                    fp[x, y] = (min(255, r + 55), min(255, g + 60), min(255, b + 38), a)
                elif wave < -0.7:  # facet in shadow
                    fp[x, y] = (max(0, r - 18), max(0, g - 20), max(0, b - 12), a)
    return frame


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGBA")
    for i in range(FRAMES):
        phase = i * (2 * math.pi / FRAMES)
        make_frame(source, phase).convert("RGB").save(
            OUT / f"ambient-{i}.webp", format="WEBP", quality=80, method=6
        )
    print(f"Built {FRAMES} ambient (water-only) frames in {OUT}")


if __name__ == "__main__":
    main()
