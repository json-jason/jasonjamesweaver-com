#!/usr/bin/env python3
"""Cut the village's rooftops out of the painting so clouds can pass behind.

A cloud laid over the painting floats in front of everything, roofs and
chimneys included, which reads as a cloud in the street rather than one in the
sky. The fix is an overlay of the things that should be in front of the
clouds, stacked above them: painting, then clouds, then this.

Not everything goes in it. The castle and the hills it stands on are meant to
sit behind the weather - a cloud drifting across the castle is the shot - so
the middle of the picture is left out and only the village either side of it
is cut. The split is by column, measured off the skyline: the left houses
break the sky up to x=545 (the last of them being the JJW chimney at x=500 to
552), the hills and castle hold the middle, and the blacksmith's roof takes
over from x=1150.

Only the sky band is cut. Clouds never drift below it, so pixels under it
would be weight for nothing.

Output: public/images/nes/village-scene/foreground.webp
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/images/nes/village.webp"
OUT = ROOT / "public/images/nes/village-scene/foreground.webp"

FIELD_W = 1448
FIELD_H = 1086

# Columns where the village stands in front of the weather. Between them are
# the hills and the castle, which stay behind it.
FRONT_ZONES = ((0, 545), (1150, FIELD_W))

# Clouds live above this line, so there is nothing to occlude below it.
# build_village_clouds.py asserts that no cloud in a front zone reaches past
# it, so a cloud can never appear on top of a roof below the cut.
SKY_BAND = 470


def is_sky(r: int, g: int, b: int) -> bool:
    return b > 150 and b > r + 40 and g > r


def main() -> None:
    with Image.open(SOURCE) as art:
        if art.size != (FIELD_W, FIELD_H):
            raise SystemExit(f"Expected village art at {FIELD_W}x{FIELD_H}, found {art.size}")
        source = art.convert("RGB")

    px = source.load()
    layer = Image.new("RGBA", (FIELD_W, SKY_BAND), (0, 0, 0, 0))
    out = layer.load()

    cut = 0
    for zone_start, zone_end in FRONT_ZONES:
        for x in range(zone_start, zone_end):
            for y in range(SKY_BAND):
                r, g, b = px[x, y]
                if is_sky(r, g, b):
                    continue
                out[x, y] = (r, g, b, 255)
                cut += 1

    # A zone that catches no roof means the column split has drifted off the
    # artwork - better to fail than to ship clouds floating through a house.
    for zone_start, zone_end in FRONT_ZONES:
        in_zone = sum(
            1
            for x in range(zone_start, zone_end, 4)
            for y in range(0, SKY_BAND, 4)
            if out[x, y][3]
        )
        if in_zone < 200:
            raise SystemExit(f"zone {zone_start}-{zone_end} caught almost nothing; check FRONT_ZONES")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    layer.save(OUT, format="WEBP", lossless=True, method=6)
    kb = OUT.stat().st_size / 1024
    print(f"foreground: {cut} px of village cut out above y={SKY_BAND}, {kb:.0f} KB")
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
