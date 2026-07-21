#!/usr/bin/env python3
"""Author a looping ambient title set: waving castle flag + shimmering river.

Only the flag and water pixels change between frames; everything else is copied
from the static title screen. Runtime cross-cuts the frames (stacked opacity
layers) to loop gently before PRESS START. Frame 0 is the clean baseline (LCP).
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/images/nes/title-screen.webp"
OUT = ROOT / "public/images/nes/title-scene/ambient"

FRAMES = 6

# Flag region on the tall castle tower, and the pole's x within it.
FLAG_BOX = (1008, 431, 1063, 465)
POLE_X = 1017

# River band in the lower-left. Only blue "water" pixels inside are shimmered.
WATER_BOX = (70, 905, 330, 1072)


def is_flag(r: int, g: int, b: int) -> bool:
    # Navy pennant against a warm pink/orange sky: blue-dominant and not bright.
    return b > r + 16 and b > g + 3 and b > 62 and r < 150


def is_water(r: int, g: int, b: int) -> bool:
    # Blue-dominant (excludes green trees/grass) and not too dark.
    return b > g + 6 and b >= r and b > 85


def build_clean_sky(base: Image.Image) -> Image.Image:
    """Return a copy with the flag erased. For each row, any bluish pixel (the
    navy pennant) is replaced with clean sky sampled from just RIGHT of the flag
    at the same row, preserving the vertical sky gradient. Brownish pole pixels
    (r > b) and pinkish sky (r >= b) are left untouched, so the pole survives."""
    px = base.load()
    x0, y0, x1, y1 = FLAG_BOX
    for y in range(y0, y1):
        ref = [px[x, y] for x in range(x1 + 4, x1 + 12)]  # open sky to the right
        n = len(ref)
        sky = (
            sum(c[0] for c in ref) // n,
            sum(c[1] for c in ref) // n,
            sum(c[2] for c in ref) // n,
            255,
        )
        for x in range(x0, x1):
            r, g, b, _ = px[x, y]
            if b > r:  # bluish -> flag pixel; pole (brown) and sky (pink) keep
                px[x, y] = sky
    return base


def collect_flag(source: Image.Image) -> list[tuple[int, int, tuple]]:
    px = source.load()
    x0, y0, x1, y1 = FLAG_BOX
    pixels = []
    for y in range(y0, y1):
        for x in range(x0, x1):
            c = px[x, y]
            if is_flag(*c[:3]):
                pixels.append((x, y, c))
    return pixels


def make_frame(clean: Image.Image, flag_pixels: list, phase: float) -> Image.Image:
    frame = clean.copy()
    fp = frame.load()
    cp = clean.load()
    # --- Flag: gentle traveling undulation. Whole columns shift by the same
    # small dy (<=2px) and the wave is low-frequency, so the cloth stays
    # connected instead of fragmenting into detached specks. ---
    drawn: dict[tuple[int, int], tuple] = {}
    for x, y, color in flag_pixels:
        d = x - POLE_X
        amp = 0.5 + 0.038 * d  # ~0.5px near the pole, ~2px at the tip
        dy = round(amp * math.sin(d * 0.22 - phase))
        dy = max(-2, min(2, dy))
        ny = min(clean.height - 1, max(0, y + dy))
        fp[x, ny] = color
        drawn[(x, ny)] = color

    # Keep only the largest connected blob of flag pixels (8-connectivity) and
    # erase everything detached from it back to sky. The wave keeps the pennant
    # body contiguous, so this removes any stray dark specks of any size without
    # touching the flag itself.
    visited: set[tuple[int, int]] = set()
    largest: list[tuple[int, int]] = []
    for start in drawn:
        if start in visited:
            continue
        stack = [start]
        visited.add(start)
        component = []
        while stack:
            cx, cy = stack.pop()
            component.append((cx, cy))
            for dx in (-1, 0, 1):
                for dy2 in (-1, 0, 1):
                    neighbor = (cx + dx, cy + dy2)
                    if neighbor in drawn and neighbor not in visited:
                        visited.add(neighbor)
                        stack.append(neighbor)
        if len(component) > len(largest):
            largest = component
    keep = set(largest)
    for (x, y) in drawn:
        if (x, y) not in keep:
            fp[x, y] = cp[x, y]

    # --- Water: traveling sparkle over the blue highlights. The temporal term
    # advances exactly one cycle across the loop (integer multiple of phase) so
    # the shimmer loops seamlessly instead of jumping at the wrap. ---
    x0, y0, x1, y1 = WATER_BOX
    for y in range(y0, y1):
        for x in range(x0, x1):
            r, g, b, a = cp[x, y]
            if not is_water(r, g, b):
                continue
            wave = math.sin(x * 0.16 + y * 0.11 - phase)
            if b > 150 and wave > 0.55:  # bright reflections glint brighter
                fp[x, y] = (min(255, r + 26), min(255, g + 28), min(255, b + 24), a)
            elif wave < -0.72:  # troughs dip slightly
                fp[x, y] = (max(0, r - 14), max(0, g - 12), max(0, b - 6), a)
    return frame


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGBA")
    flag_pixels = collect_flag(source)
    clean = build_clean_sky(source.copy())
    for i in range(FRAMES):
        phase = i * (2 * math.pi / FRAMES)
        frame = make_frame(clean, flag_pixels, phase)
        frame.convert("RGB").save(OUT / f"ambient-{i}.webp", format="WEBP", quality=80, method=6)
    print(f"Built {FRAMES} ambient frames in {OUT} (flag pixels: {len(flag_pixels)})")


if __name__ == "__main__":
    main()
