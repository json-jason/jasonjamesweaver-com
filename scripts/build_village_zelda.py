#!/usr/bin/env python3
"""Cut Zelda, Jason's dog, out of her sprite sheet for the village map.

The sheet came out of an image model as fourteen poses on a flat magenta
ground, drawn at roughly twice the size she should stand in the village. So
each pose is keyed off the magenta and shrunk to village scale, keeping the
detail as drawn.

Every pose is placed on one shared canvas, standing on its bottom edge and
centred across it. That way the page can swap one pose for another, or flip
her to walk the other way, without her jumping: only her position on the map
moves, and that is the page's job.

Outputs:
  public/images/nes/village-scene/zelda-<pose>.webp
  app/data/village-zelda.json  (the canvas size as a share of the painting)
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

from sprite_sheet import cut, loose_ground

ROOT = Path(__file__).resolve().parents[1]
SHEET = ROOT / "public/images/nes/village-scene/source/zelda-sheet.webp"
OUT = ROOT / "public/images/nes/village-scene"
MANIFEST = ROOT / "app/data/village-zelda.json"

FIELD_W = 1448
FIELD_H = 1086

# Painting pixels per sheet pixel. At half size her back sits just under the
# top rail of the front fence, which is where the brief put her.
SCALE = 0.5
# The poses, in the order they sit on the sheet, as (x, y, width, height).
# Measured once by finding the gaps between them; the sheet does not change.
POSES = {
    "walk-0": (56, 37, 332, 198),
    "walk-1": (446, 48, 308, 182),
    "walk-2": (810, 37, 318, 197),
    "walk-3": (1178, 37, 312, 197),
    "stand": (150, 278, 335, 218),
    "look-back": (610, 264, 279, 235),
    "face": (1015, 264, 302, 240),
    "sit": (155, 522, 282, 238),
    "sit-front": (610, 522, 218, 239),
    "sit-tilt": (1026, 522, 238, 234),
    "lie": (34, 808, 363, 143),
    "lie-rest": (455, 834, 357, 120),
    "wag-0": (875, 782, 287, 198),
    "wag-1": (1224, 774, 280, 206),
}


def main() -> None:
    sheet = np.asarray(Image.open(SHEET).convert("RGB"))
    poses = {name: cut(sheet, box, SCALE, loose_ground) for name, box in POSES.items()}

    canvas_w = max(p.shape[1] for p in poses.values())
    canvas_h = max(p.shape[0] for p in poses.values())

    for name, pose in poses.items():
        art = np.zeros((canvas_h, canvas_w, 4), np.uint8)
        top = canvas_h - pose.shape[0]
        left = (canvas_w - pose.shape[1]) // 2
        art[top:, left : left + pose.shape[1]] = pose
        Image.fromarray(art).save(OUT / f"zelda-{name}.webp", lossless=True)

    manifest = {
        "poses": list(POSES),
        "width": f"{canvas_w / FIELD_W * 100:.4f}%",
        "height": f"{canvas_h / FIELD_H * 100:.4f}%",
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"{len(poses)} poses, canvas {canvas_w}x{canvas_h} painting px")


if __name__ == "__main__":
    main()
