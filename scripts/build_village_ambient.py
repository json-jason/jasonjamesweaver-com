#!/usr/bin/env python3
"""Author the village map's glow loops: the forge fire and the library lamps.

The map is one flat painting, so animating it the way the title screen is
animated - rebuilding the whole 1448x1086 field per frame - would cost ~180KB
a frame for effects that touch a few thousand pixels. Instead each effect is
cut out as its own small region and rebuilt only inside that box. The runtime
stacks the frames of a region over the painting at the region's own position,
cross-cutting them by opacity exactly like the title frames. A region's frames
are a few KB, so several effects can run at once, each at its own speed.

Only emissive pixels move. These are *glow* loops: the light coming off a fire
or a lamp brightens and dims, and nothing changes shape. That is the one kind
of change that survives on flattened pixel art - the title screen's own notes
record what happens when you try to displace authored pixels instead (see
build_title_ambient.py: the castle flag had to be left static). Anything that
has to change shape - the castle pennant, chimney smoke, drifting cloud -
needs authored sprites and is not attempted here.

Outputs (WebP, lossless - these are small, hard-edged, few-colour tiles and
lossy rings around the embers):
  public/images/nes/village-scene/forge-0..N.webp
  public/images/nes/village-scene/library-0..N.webp
"""

from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/images/nes/village.webp"
OUT = ROOT / "public/images/nes/village-scene"
MANIFEST = ROOT / "app/data/village-glows.json"

# The painting's own size. Regions are quoted against it, and the runtime
# positions each region as a percentage of these, so the overlays track the
# artwork at every viewport instead of needing their own breakpoints.
FIELD_W = 1448
FIELD_H = 1086

FRAMES = 6


# A patch repaints only what is inside it, so any change that reaches its
# border would pulse against the identical, static pixel one step outside: a
# hard rectangle switching on and off. Rather than hunt for a box whose edges
# happen to be dark, every change is multiplied by a falloff that is zero on
# the border and reaches full strength FEATHER pixels in. A seam then cannot
# occur, whatever the artwork does near the edge.
FEATHER = 8


class Region:
    """A lit part of the painting, plus how its light behaves."""

    def __init__(self, name, box, frame_ms, swing, lick, seed):
        self.name = name
        self.box = box  # (x0, y0, x1, y1) in field pixels
        self.frame_ms = frame_ms
        self.swing = swing  # peak brightness departure, e.g. 0.20 -> ±20%
        self.lick = lick  # how much the brightness varies DOWN the region
        self.seed = seed  # phase offset, so two regions never pulse together


REGIONS = [
    # The blacksmith's forge. A fire is restless: a wide swing, and a strong
    # vertical term so the light runs up the flames instead of the whole fire
    # breathing as one lump.
    Region("forge", (1278, 686, 1340, 768), frame_ms=110, swing=0.22, lick=0.55, seed=0.0),
    # The library's two door lamps and the candle in the door window, taken as
    # one patch - they are close enough that one is cheaper than three, and the
    # dead wall between them simply scores zero and is reproduced exactly.
    # A lamp is steady: a small swing, almost no vertical term, and a slower
    # beat than the fire so the two are never in step.
    Region("library", (70, 666, 220, 730), frame_ms=210, swing=0.11, lick=0.12, seed=1.7),
]


def clamp01(v: float) -> float:
    return 0.0 if v < 0 else 1.0 if v > 1 else v


def fire_strength(r: int, g: int, b: int) -> float:
    """How much this pixel reads as light rather than as warm-coloured paint.

    A weight, not a verdict. The village is full of warm browns - thatch,
    dirt, timber, lit stone - and a yes/no test either brightens them too
    (whole buildings pulse) or is drawn so tight that it punches the pale
    core out of the middle of the fire. Scoring both warmth and brightness
    and multiplying leaves flame and lamp-glass near 1, embers high, timber
    around 0.1, and everything cool at 0.
    """
    warmth = clamp01((r - b - 30) / 140)
    brightness = clamp01((max(r, g, b) - 120) / 100)
    return warmth * brightness


def edge_falloff(x: int, y: int, w: int, h: int) -> float:
    """1 well inside the patch, 0 on its border, smooth in between."""
    inset = min(x, y, w - 1 - x, h - 1 - y)
    if inset >= FEATHER:
        return 1.0
    t = inset / FEATHER
    return t * t * (3 - 2 * t)  # smoothstep: no visible banding in the ramp


def frame_factor(region: Region, phase: float, y_frac: float) -> float:
    """Brightness multiplier for one pixel row at one point in the loop.

    Both terms are whole harmonics of the loop, so the cycle closes seamlessly.
    The first is the fundamental; the second is its octave, which keeps the
    light from reading as a clean sine - real firelight is not metronomic. Each
    carries a y-dependent phase lag, so the bright part of the light climbs the
    region instead of the whole box breathing as one lump.

    `lick` scales how much of that vertical travel applies, which is the whole
    difference between a fire and a lamp: a lamp should very nearly just pulse.
    """
    lag = y_frac * math.pi * region.lick
    fundamental = math.sin(phase + region.seed - lag * 1.6)
    octave = math.sin(2 * phase + region.seed * 1.3 - lag * 2.4)
    return 1.0 + region.swing * (0.65 * fundamental + 0.35 * octave)


def build_region(source: Image.Image, region: Region) -> list[Image.Image]:
    x0, y0, x1, y1 = region.box
    tile = source.crop((x0, y0, x1, y1)).convert("RGB")
    w, h = tile.size
    base = tile.load()

    # Weight per pixel is fixed for the whole loop; only the phase moves.
    weight = [
        [fire_strength(*base[x, y]) * edge_falloff(x, y, w, h) for x in range(w)]
        for y in range(h)
    ]
    if max(max(row) for row in weight) < 0.4:
        raise SystemExit(f"{region.name}: nothing in {region.box} reads as light - wrong box?")

    frames = []
    for i in range(FRAMES):
        phase = 2 * math.pi * i / FRAMES
        out = tile.copy()
        op = out.load()
        for y in range(h):
            swing = frame_factor(region, phase, y / max(1, h - 1)) - 1.0
            row = weight[y]
            for x in range(w):
                k = row[x]
                if k == 0:
                    continue
                factor = 1.0 + swing * k
                r, g, b = base[x, y]
                op[x, y] = (
                    min(255, max(0, round(r * factor))),
                    min(255, max(0, round(g * factor))),
                    # Blue lifts less than red and green: hot light goes
                    # yellow-white as it brightens, it does not go pink.
                    min(255, max(0, round(b * (1 + (factor - 1) * 0.45)))),
                )
        frames.append(out)
    return frames


def main() -> None:
    with Image.open(SOURCE) as art:
        if art.size != (FIELD_W, FIELD_H):
            raise SystemExit(f"Expected village art at {FIELD_W}x{FIELD_H}, found {art.size}")
        source = art.convert("RGB")

    OUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    for region in REGIONS:
        x0, y0, x1, y1 = region.box

        frames = build_region(source, region)

        # The seam check, asserted where the frames are made rather than left
        # to the eye: nothing on a patch's border may differ from the painting
        # underneath it, in any frame. If it does, the patch has a visible
        # edge that switches on and off, and the whole effect is worse than
        # no effect.
        base = source.crop(region.box).load()
        w, h = x1 - x0, y1 - y0
        for i, frame in enumerate(frames):
            fp = frame.load()
            for y in range(h):
                for x in range(w):
                    if not (x in (0, w - 1) or y in (0, h - 1)):
                        continue
                    if fp[x, y] != base[x, y]:
                        raise SystemExit(
                            f"{region.name} frame {i}: border pixel ({x},{y}) changed "
                            f"{base[x, y]} -> {fp[x, y]}; the patch would show a seam"
                        )

        for i, frame in enumerate(frames):
            frame.save(OUT / f"{region.name}-{i}.webp", format="WEBP", lossless=True, method=6)

        manifest.append(
            {
                "name": region.name,
                "frames": FRAMES,
                "frameMs": region.frame_ms,
                "box": {
                    "left": f"{x0 / FIELD_W:.4%}",
                    "top": f"{y0 / FIELD_H:.4%}",
                    "width": f"{(x1 - x0) / FIELD_W:.4%}",
                    "height": f"{(y1 - y0) / FIELD_H:.4%}",
                },
            }
        )
        print(f"{region.name}: {FRAMES} frames of {x1-x0}x{y1-y0} at ({x0},{y0})")

    # The page reads this rather than carrying copied percentages: the patches
    # are measured from the artwork, so their placement has to come from the
    # same pass that cut them.
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"wrote {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
