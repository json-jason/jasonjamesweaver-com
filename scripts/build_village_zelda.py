#!/usr/bin/env python3
"""Cut Zelda, Jason's dog, out of her sprite sheet for the village map.

The sheet came out of an image model as fourteen poses on a flat magenta
ground, drawn at roughly twice the size she should stand in the village and
on a finer pixel grid than the painting. So each pose is keyed off the
magenta, shrunk to village scale, and snapped back onto a coarse grid of
GRID painting pixels, which is what makes her read as part of the picture
rather than a sticker laid over it.

Every pose is placed on one shared canvas, standing on its bottom edge and
centred across it. That way the page can swap one pose for another, or flip
her to walk the other way, without her jumping: only her position on the map
moves, and that is the page's job.

One palette is built from all the poses together and applied to each, so the
same patch of fur is the same colour in every frame. Without it a walking
step can flicker between two creams.

Outputs:
  public/images/nes/village-scene/zelda-<pose>.webp
  app/data/village-zelda.json  (the canvas size as a share of the painting)
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

from sprite_sheet import cut, loose_ground, shared_palette, snap

ROOT = Path(__file__).resolve().parents[1]
SHEET = ROOT / "public/images/nes/village-scene/source/zelda-sheet.webp"
OUT = ROOT / "public/images/nes/village-scene"
MANIFEST = ROOT / "app/data/village-zelda.json"

FIELD_W = 1448
FIELD_H = 1086

# Sheet pixels per painting pixel. At half size her back sits just under the
# top rail of the front fence, which is where the brief put her.
SCALE = 0.5
# Painting pixels per art pixel. The painting's own grid runs about four to
# five; three keeps her face readable at this size while still looking
# blocky next to the fence.
GRID = 3
BLOCK = round(GRID / SCALE)
PALETTE_COLOURS = 24

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
    poses = {name: cut(sheet, box, BLOCK, loose_ground) for name, box in POSES.items()}
    palette = shared_palette(poses, PALETTE_COLOURS)

    canvas_w = max(p.shape[1] for p in poses.values())
    canvas_h = max(p.shape[0] for p in poses.values())

    for name, pose in poses.items():
        art = np.zeros((canvas_h, canvas_w, 4), np.uint8)
        top = canvas_h - pose.shape[0]
        left = (canvas_w - pose.shape[1]) // 2
        art[top:, left : left + pose.shape[1]] = snap(pose, palette)
        # Up to painting pixels, so the file lines up with every other patch.
        image = Image.fromarray(art).resize((canvas_w * GRID, canvas_h * GRID), Image.NEAREST)
        image.save(OUT / f"zelda-{name}.webp", lossless=True)

    manifest = {
        "poses": list(POSES),
        "width": f"{canvas_w * GRID / FIELD_W * 100:.4f}%",
        "height": f"{canvas_h * GRID / FIELD_H * 100:.4f}%",
        # One art pixel as a share of the painting's width. The page steps
        # her walk by this much so she stays on the grid.
        "step": round(GRID / FIELD_W * 100, 4),
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"{len(poses)} poses, canvas {canvas_w * GRID}x{canvas_h * GRID} painting px")


if __name__ == "__main__":
    main()
