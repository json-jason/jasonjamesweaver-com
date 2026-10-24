#!/usr/bin/env python3
"""Place the drifting clouds on the village map and set their speeds.

The cloud sprites themselves are not generated here. They were cut out of the
previous artwork by build_village_sky.py, which solved a matte for each one so
the sky behind it could be repaired. That artwork has since been redrawn with
an empty sky, so nothing needs cutting any more and no repair overlay is
needed - but the eight sprites are good pixel art in the right style, so they
are kept as authored assets and simply placed on the clean sky.

This script therefore holds decisions, not measurements: where each cloud sits
and how fast it crosses.

Speed is the thing that was wrong before. The clouds were set to cross in
158 to 250 seconds, which is about half a pixel per second - true movement
that nobody can see. They now cross in 48 to 96 seconds. Lower clouds are
faster than high ones, because that is what distance looks like; the previous
version had that backwards.

Outputs: the "clouds" half of app/data/village-sky.json. The other half, the
chimney smoke, is written by build_village_smoke.py.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / "public/images/nes/village-scene"
MANIFEST = ROOT / "app/data/village-sky.json"

FIELD_W = 1448
FIELD_H = 1086

# Where the sky ends and the hills begin. Used only to work out how "high" a
# cloud is, which sets its speed.
SKY_DEPTH = 520

# Seconds to cross the whole picture: the highest cloud is slowest.
SLOWEST = 96
FASTEST = 48

# (sprite, left, top) in field pixels. Spread across the sky at varying
# heights, with the biggest clouds kept high so they do not crowd the castle.
PLACEMENTS = [
    ("cloud-0", 1010, 40),
    ("cloud-1", 150, 92),
    ("cloud-2", 560, 150),
    ("cloud-3", 1180, 210),
    ("cloud-4", 300, 250),
    ("cloud-5", 790, 300),
    ("cloud-6", 1230, 350),
    ("cloud-7", 60, 392),
]


def main() -> None:
    clouds = []
    for name, left, top in PLACEMENTS:
        path = SPRITES / f"{name}.webp"
        if not path.exists():
            raise SystemExit(f"missing sprite {path.relative_to(ROOT)}")
        with Image.open(path) as sprite:
            w, h = sprite.size

        if left + w > FIELD_W or top + h > FIELD_H:
            raise SystemExit(f"{name} at ({left},{top}) runs off the picture")

        depth = min(1.0, top / SKY_DEPTH)
        seconds = round(SLOWEST - (SLOWEST - FASTEST) * depth)
        clouds.append(
            {
                "name": name,
                "seconds": seconds,
                "box": {
                    "left": f"{left / FIELD_W:.4%}",
                    "top": f"{top / FIELD_H:.4%}",
                    "width": f"{w / FIELD_W:.4%}",
                    "height": f"{h / FIELD_H:.4%}",
                },
            }
        )
        print(f"  {name}: {w}x{h} at ({left},{top}), crosses in {seconds}s")

    data = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    data["clouds"] = clouds
    MANIFEST.write_text(json.dumps(data, indent=2) + "\n")
    print(f"wrote {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
