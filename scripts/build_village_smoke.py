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
FRAMES = 32
PUFFS = 7
FRAME_MS = 250

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


def puff_shape(phase: float, seed: int) -> list[tuple[float, float, float, tuple[int, int, int]]]:
    """A puff as a cluster of overlapping discs: (dx, dy, radius, colour).

    One disc is a ball, not smoke, and a row of identical clusters is a string
    of bubbles - which is what the first version looked like. So each puff is
    built from six discs whose offsets and sizes are jittered from a seed, and
    the seed is the puff's index, so no two puffs in the loop are the same
    shape. The jitter is deterministic, so the loop still closes: on the frame
    after the last, every puff is back at its own starting phase.

    The cluster swells as it rises, and spreads sideways faster than it grows
    tall, the way smoke loses its shape as it cools.
    """
    grow = 1.0 + phase * 2.6
    spread = 1.0 + phase * 1.5

    def wobble(n: int) -> float:
        # A cheap deterministic hash in [-1, 1]; no RNG, so a rebuild of the
        # frames is always byte-identical.
        return ((seed * 37 + n * 101) % 23) / 11.0 - 1.0

    discs = []
    for n, (bx, by, br, colour) in enumerate(
        [
            (-3.4, 2.0, 3.6, MID),
            (3.0, 1.4, 3.4, MID),
            (-1.6, -0.6, 4.2, LIGHT),
            (2.2, -1.0, 4.0, LIGHT),
            (0.0, -2.6, 4.6, WHITE),
            (-0.4, 0.8, 4.4, WHITE),
        ]
    ):
        discs.append(
            (
                (bx + wobble(n) * 2.2 * phase) * spread,
                (by + wobble(n + 7) * 1.6) * grow,
                (br + wobble(n + 13) * 0.9) * grow,
                colour,
            )
        )
    return discs


def build(chimney: Chimney, box: tuple[int, int, int, int]) -> list[Image.Image]:
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    bw, bh = w // BLOCK + 1, h // BLOCK + 1

    frames = []
    for i in range(FRAMES):
        coarse = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
        draw = ImageDraw.Draw(coarse)
        for k in range(PUFFS):
            phase = ((i / FRAMES) + k / PUFFS) % 1.0
            # Opacity is zero at both ends of a puff's life, so the oldest
            # puff has vanished exactly as the newest appears and the loop
            # has no visible join. In between it is not symmetric: a puff
            # thickens almost at once as it clears the chimney, then takes
            # the rest of its life to thin out. A symmetric curve left a gap
            # of clear sky above the stack, as though the smoke started a
            # foot up.
            alpha = min(1.0, phase / 0.10) * (1.0 - phase) ** 0.85
            if alpha <= 0.01:
                continue
            # The climb eases off: smoke leaves the chimney briskly and slows
            # as it spreads.
            climb = phase ** 0.78
            cx = chimney.mouth_x + chimney.drift * max(0.0, phase - chimney.lean) ** 1.5
            cy = chimney.mouth_y - chimney.travel * climb
            # A slow sideways wander on top of the lean, so the column is not
            # a straight line of identical blobs.
            cx += math.sin(phase * math.pi * 2.2 + k) * 3.5 * phase

            for dx, dy, radius, colour in puff_shape(phase, k):
                px = (cx + dx - x0) / BLOCK
                py = (cy + dy - y0) / BLOCK
                r = radius / BLOCK
                draw.ellipse((px - r, py - r, px + r, py + r), fill=(*colour, round(alpha * 255)))

        frame = coarse.resize((bw * BLOCK, bh * BLOCK), Image.NEAREST).crop((0, 0, w, h))
        frames.append(frame)
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
        reach = int(abs(chimney.drift)) + 26
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
