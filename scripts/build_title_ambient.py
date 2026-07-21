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

# The castle flag. We shimmer light across it (no pixel movement) to suggest a
# breeze; the mask below cleanly isolates the navy cloth from the purple sky.
FLAG_BOX = (1004, 428, 1066, 468)


def is_water(r: int, g: int, b: int) -> bool:
    # Blue-dominant (excludes green trees/grass) and not too dark.
    return b > g + 6 and b >= r and b > 85


def is_flag(r: int, g: int, b: int) -> bool:
    # Strong blue dominance and not too bright: catches the navy pennant while
    # excluding the lighter purple sky around it.
    return b > r + 18 and b > g + 8 and (r + g + b) < 360


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

    # Flag: a band of light ripples along the cloth (pole → tip) once per loop,
    # brightening/dimming the navy pixels to read as a breeze. No pixels move,
    # so the crisp pennant shape is preserved.
    fx0, fy0, fx1, fy1 = FLAG_BOX
    for y in range(fy0, fy1):
        for x in range(fx0, fx1):
            r, g, b, a = sp[x, y]
            if not is_flag(r, g, b):
                continue
            wave = math.sin(x * 0.32 + y * 0.10 - phase)
            if wave > 0.45:  # cloth catches the light
                fp[x, y] = (min(255, r + 34), min(255, g + 44), min(255, b + 46), a)
            elif wave < -0.55:  # cloth in the trough of the wave
                fp[x, y] = (max(0, r - 16), max(0, g - 16), max(0, b - 12), a)
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
