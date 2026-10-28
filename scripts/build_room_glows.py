#!/usr/bin/env python3
"""Author the glow loops inside the rooms: candles, lanterns, fires, torches.

Same method as the village map (build_village_ambient.py), reused rather than
copied: each light is cut out as a small patch, only its emissive pixels
brighten and dim, and the patch edge is feathered so it can never show a seam.
The page stacks a patch's frames over the room painting at the patch's own
position.

Outputs (WebP, lossless):
  public/images/nes/room-scene/<room>-<light>-0..N.webp
  app/data/room-glows.json  (keyed by screen id)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_village_ambient import FIELD_H, FIELD_W, FRAMES, Region, build_region  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "public/images/nes"
OUT = ART / "room-scene"
MANIFEST = ROOT / "app/data/room-glows.json"

# Fires get the restless treatment (wide swing, light climbing the flames);
# candles and lanterns are small flames, so they mostly pulse. Every light has
# its own speed and phase, so no two in a room flicker in step.
ROOMS = {
    "library": (
        "library.webp",
        [
            Region("desk-candle", (1192, 572, 1258, 662), frame_ms=140, swing=0.24, lick=0.45, seed=0.4),
            Region("candelabra", (596, 526, 700, 602), frame_ms=165, swing=0.20, lick=0.35, seed=2.1),
        ],
    ),
    "contact": (
        "weavers-house.webp",
        [
            Region("bed-candle", (978, 198, 1022, 252), frame_ms=150, swing=0.24, lick=0.40, seed=0.9),
            Region("shelf-lantern", (450, 418, 508, 512), frame_ms=135, swing=0.20, lick=0.45, seed=2.6),
            Region("hanging-lantern", (608, 498, 714, 602), frame_ms=160, swing=0.20, lick=0.45, seed=4.2),
            Region("wall-lantern", (1276, 473, 1332, 562), frame_ms=145, swing=0.20, lick=0.45, seed=1.5),
            Region("hearth", (1318, 738, 1422, 872), frame_ms=110, swing=0.22, lick=0.55, seed=3.3),
        ],
    ),
    "quests": (
        "blacksmith.webp",
        [
            Region("lantern", (108, 468, 182, 577), frame_ms=140, swing=0.20, lick=0.45, seed=1.1),
            Region("forge", (1088, 558, 1312, 732), frame_ms=105, swing=0.16, lick=0.60, seed=0.0),
        ],
    ),
    "status": (
        "castle.webp",
        [
            Region("torch-1", (0, 403, 47, 522), frame_ms=120, swing=0.24, lick=0.55, seed=0.0),
            Region("torch-2", (316, 418, 372, 517), frame_ms=135, swing=0.24, lick=0.55, seed=1.3),
            Region("torch-3", (690, 448, 740, 542), frame_ms=115, swing=0.24, lick=0.55, seed=2.6),
            Region("torch-4", (1118, 438, 1172, 542), frame_ms=130, swing=0.24, lick=0.55, seed=3.9),
            Region("torch-5", (1378, 418, 1448, 542), frame_ms=125, swing=0.24, lick=0.55, seed=5.1),
        ],
    ),
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, list[dict]] = {}
    for room, (image, regions) in ROOMS.items():
        with Image.open(ART / image) as art:
            if art.size != (FIELD_W, FIELD_H):
                raise SystemExit(f"Expected {image} at {FIELD_W}x{FIELD_H}, found {art.size}")
            source = art.convert("RGB")

        entries = []
        for region in regions:
            x0, y0, x1, y1 = region.box
            frames = build_region(source, region)

            # The seam check from the village script: no border pixel may
            # differ from the painting underneath, in any frame. The painting's
            # own edge is exempt, since nothing lies beyond it to seam against.
            base = source.crop(region.box).load()
            w, h = x1 - x0, y1 - y0
            for i, frame in enumerate(frames):
                fp = frame.load()
                for y in range(h):
                    for x in range(w):
                        on_border = x in (0, w - 1) or y in (0, h - 1)
                        if on_border and fp[x, y] != base[x, y]:
                            raise SystemExit(f"{room}-{region.name} frame {i}: border pixel ({x},{y}) changed")

            name = f"{room}-{region.name}"
            for i, frame in enumerate(frames):
                frame.save(OUT / f"{name}-{i}.webp", format="WEBP", lossless=True, method=6)
            entries.append(
                {
                    "name": name,
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
            print(f"{name}: {FRAMES} frames of {w}x{h} at ({x0},{y0})")
        manifest[room] = entries

    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"wrote {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
