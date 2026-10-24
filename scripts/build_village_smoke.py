#!/usr/bin/env python3
"""Author rising chimney smoke for the village map.

The previous artwork had a plume painted into it, so the best that could be
done was to make that fixed shape billow in place. It read as a frozen plume
shivering, not as smoke. The artwork now ships with empty chimneys, so the
smoke can be drawn from nothing and actually leave: puffs are born at the
chimney mouth, climb, lean away on the wind, swell, thin out and are gone -
the way smoke is drawn in an old cartoon of a steam engine.

The loop closes because the puffs are evenly spaced in phase and each one's
opacity is zero at both ends of its life. Puff k is simply puff k-1 one step
further along, so the last frame hands over to the first with nothing to see.

Outputs:
  public/images/nes/village-scene/smoke-<name>-*.webp
  and its placement, appended to app/data/village-sky.json by the caller.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/images/nes/village.webp"
OUT = ROOT / "public/images/nes/village-scene"
MANIFEST = ROOT / "app/data/village-sky.json"

FIELD_W = 1448
FIELD_H = 1086

# Smoke rises slowly. The first attempt ran a puff's whole life in under two
# seconds, which read as a kettle under pressure; five was still brisk. A
# puff now takes about eight seconds to leave the chimney, climb, lean, swell
# and fade. The frame count is what keeps that slow climb smooth rather than
# visibly stepping - at this speed too few frames and the puffs crawl.
# Smoke is drawn as a flowing column, not as a row of puffs.
#
# Puffs were the obvious model and they were wrong. Evenly spaced puffs all
# advance in phase together, so the whole stack swells at once and then a puff
# pops off the top while a fresh small one appears at the mouth - the column
# visibly inflating and resetting every second or so. No amount of jitter
# fixes that; it is inherent to drawing smoke as a handful of discrete blobs.
#
# Instead there is a density field: how much smoke is at each point, as a
# plume shape multiplied by a drifting noise texture. The texture scrolls
# upward at a constant rate, so smoke flows continuously past any given
# height and nothing ever pops. Thresholding that density into three flat
# tones keeps the hard pixel edges and gives the ragged outline for free.
#
# The texture repeats NOISE_CYCLES times over the plume's height and scrolls
# exactly one of those per loop. That is what lets the loop stay short while
# the smoke is very slow: the pattern travels a seventh of the plume per
# cycle, so a wisp takes about a minute to climb from the chimney and vanish.
#
# The count also decides whether the column pulses, which is the thing that
# kept looking wrong. The noise does not average out over the plume unless
# plenty of cycles fit inside it - with two and a half, the odd half swung
# the whole column's area by 11% once per loop, and the eye reads that as
# every puff swelling at the same moment. Seven brings it to 2.3%, which is
# below noticing. Measured, not guessed: build the frames and count the
# opaque pixels per frame.
FRAMES = 30
FRAME_MS = 280
NOISE_CYCLES = 7.0

# Smoke is drawn from three flat tones, no blending between them. Anti-aliased
# circles would read as a modern soft brush dropped onto pixel art, so each
# puff is built from hard-edged discs and the tones are picked per disc.
WHITE = (255, 255, 255)
LIGHT = (226, 230, 238)
MID = (197, 202, 214)

# Puffs are drawn on a coarser grid than the artwork and scaled up, so every
# edge lands on a whole block and the curves stair-step the way hand-drawn
# pixel smoke does.
BLOCK = 3


class Chimney:
    def __init__(self, name, mouth_x, mouth_y, drift, travel, lean):
        self.name = name
        self.mouth_x = mouth_x  # centre of the chimney opening, field pixels
        self.mouth_y = mouth_y  # the top of the stonework
        self.drift = drift  # how far the smoke leans by the end of its climb
        self.travel = travel  # how far it climbs before it is gone
        self.lean = lean  # start of the sideways drift, 0 = immediately


CHIMNEYS = [
    # The thatched house on the left. Its smoke has the most room, so it is
    # the one that really reads: it climbs clear of the roofline and leaves.
    Chimney("left", mouth_x=96, mouth_y=156, drift=86, travel=168, lean=0.25),
    # The JJW house. Its chimney tops out at y=355, lower than the other two,
    # so its smoke has the shortest run before it is gone.
    Chimney("jjw", mouth_x=526, mouth_y=355, drift=64, travel=236, lean=0.28),
    # The blacksmith on the right. Leaning the other way keeps the three from
    # looking like one effect pasted three times.
    Chimney("right", mouth_x=1261, mouth_y=262, drift=-74, travel=252, lean=0.30),
]


def noise(u: float, v: float) -> float:
    """A drifting texture in [-1, 1], periodic in v with period 1.

    Built from sine terms whose v-frequencies are whole numbers, so advancing
    v by exactly 1 returns the field to itself - which is what makes the loop
    close with no seam. No random numbers, so a rebuild is byte-identical.
    """
    # The sideways coefficients are small on purpose. With them large the
    # texture varied faster across the column than along it, which drew long
    # thin streaks - the plume read as a flame or a feather rather than
    # smoke. Keeping them near the vertical rate makes the cells roughly
    # round, so the column billows.
    return (
        0.55 * math.sin(2 * math.pi * (v + 0.72 * u))
        + 0.28 * math.sin(2 * math.pi * (2 * v - 1.25 * u) + 1.3)
        + 0.17 * math.sin(2 * math.pi * (3 * v + 1.90 * u) + 2.7)
    )


def build(chimney: Chimney, box: tuple[int, int, int, int]) -> list[Image.Image]:
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    bw, bh = w // BLOCK + 1, h // BLOCK + 1

    frames = []
    for i in range(FRAMES):
        scroll = i / FRAMES
        coarse = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
        cp = coarse.load()

        for by in range(bh):
            fy = y0 + by * BLOCK
            # Height above the chimney mouth, 0 at the stack and 1 where the
            # smoke is gone.
            climb = (chimney.mouth_y - fy) / chimney.travel
            if not (0.0 <= climb <= 1.0):
                continue

            # The column leans away on the wind and widens as it cools, and
            # thins out towards the top until there is nothing left.
            centre = chimney.mouth_x + chimney.drift * max(0.0, climb - chimney.lean) ** 1.5
            width = 11.0 + 24.0 * climb
            fade = (1.0 - climb) ** 0.80

            v = climb * NOISE_CYCLES - scroll
            for bx in range(bw):
                fx = x0 + bx * BLOCK
                across = (fx - centre) / width
                if abs(across) > 2.6:
                    continue
                # Fat in the middle, feathering out at the sides.
                body = math.exp(-across * across * 0.95)
                density = body * fade * (0.86 + 0.44 * noise(across, v))

                # Three flat tones and a hard cut to nothing. The noise makes
                # these boundaries wander, which is where the ragged edge and
                # the holes in the column come from.
                if density > 0.62:
                    cp[bx, by] = (*WHITE, 255)
                elif density > 0.38:
                    cp[bx, by] = (*LIGHT, 255)
                elif density > 0.17:
                    cp[bx, by] = (*MID, 255)

        frames.append(coarse.resize((bw * BLOCK, bh * BLOCK), Image.NEAREST).crop((0, 0, w, h)))
    return frames


def main() -> None:
    with Image.open(SOURCE) as art:
        if art.size != (FIELD_W, FIELD_H):
            raise SystemExit(f"Expected village art at {FIELD_W}x{FIELD_H}, found {art.size}")

    OUT.mkdir(parents=True, exist_ok=True)
    entries = []
    for chimney in CHIMNEYS:
        # The box has to hold every puff at its fattest, including the lean,
        # or the smoke is clipped by its own sprite.
        reach = int(abs(chimney.drift)) + 40
        x0 = max(0, chimney.mouth_x - (reach if chimney.drift < 0 else 26))
        x1 = min(FIELD_W, chimney.mouth_x + (reach if chimney.drift > 0 else 26))
        y0 = max(0, chimney.mouth_y - chimney.travel - 26)
        y1 = min(FIELD_H, chimney.mouth_y + 10)
        box = (x0, y0, x1, y1)

        frames = build(chimney, box)
        for i, frame in enumerate(frames):
            frame.save(OUT / f"smoke-{chimney.name}-{i}.webp", format="WEBP", lossless=True, method=6)

        entries.append(
            {
                "name": f"smoke-{chimney.name}",
                "frames": FRAMES,
                "frameMs": FRAME_MS,
                "box": {
                    "left": f"{x0 / FIELD_W:.4%}",
                    "top": f"{y0 / FIELD_H:.4%}",
                    "width": f"{(x1 - x0) / FIELD_W:.4%}",
                    "height": f"{(y1 - y0) / FIELD_H:.4%}",
                },
            }
        )
        print(f"smoke-{chimney.name}: {FRAMES} frames of {x1-x0}x{y1-y0} at ({x0},{y0})")

    data = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    data["smoke"] = entries
    MANIFEST.write_text(json.dumps(data, indent=2) + "\n")
    print(f"wrote {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
