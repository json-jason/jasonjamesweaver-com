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

# How far a pixel has to lean towards magenta to count as background. The
# sheet is lossy, so the ground is not one exact colour, and the outline
# pixels it was blended into come out purple; both are dropped here.
MAGENTA_LEAN = 60

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


def cut(sheet: np.ndarray, box: tuple[int, int, int, int]) -> np.ndarray:
    """Key one pose off the magenta and reduce it to art pixels (RGBA)."""
    x, y, w, h = box
    pad = BLOCK
    crop = sheet[y - pad : y + h + pad, x - pad : x + w + pad].astype(int)
    r, g, b = crop[..., 0], crop[..., 1], crop[..., 2]
    solid = (np.minimum(r, b) - g) < MAGENTA_LEAN

    rows = crop.shape[0] // BLOCK
    cols = crop.shape[1] // BLOCK
    out = np.zeros((rows, cols, 4), np.uint8)
    for j in range(rows):
        for i in range(cols):
            cell = (slice(j * BLOCK, (j + 1) * BLOCK), slice(i * BLOCK, (i + 1) * BLOCK))
            mask = solid[cell]
            # Half the block has to be dog for the art pixel to be dog. The
            # median of only those pixels keeps the outline dark instead of
            # averaging it into the fur.
            if mask.mean() < 0.5:
                continue
            out[j, i, :3] = np.median(crop[cell][mask], axis=0)
            out[j, i, 3] = 255
    ys, xs = np.nonzero(out[..., 3])
    return out[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]


def main() -> None:
    sheet = np.asarray(Image.open(SHEET).convert("RGB"))
    poses = {name: cut(sheet, box) for name, box in POSES.items()}

    # One palette for every pose, built from all of their opaque pixels.
    solid = np.concatenate([p[p[..., 3] > 0][:, :3] for p in poses.values()])
    strip = Image.fromarray(solid.reshape(1, -1, 3))
    palette = strip.quantize(PALETTE_COLOURS, method=Image.Quantize.MEDIANCUT)

    canvas_w = max(p.shape[1] for p in poses.values())
    canvas_h = max(p.shape[0] for p in poses.values())

    for name, pose in poses.items():
        rgb = Image.fromarray(np.ascontiguousarray(pose[..., :3]))
        snapped = np.asarray(rgb.quantize(palette=palette, dither=Image.Dither.NONE).convert("RGB"))
        art = np.zeros((canvas_h, canvas_w, 4), np.uint8)
        top = canvas_h - pose.shape[0]
        left = (canvas_w - pose.shape[1]) // 2
        art[top:, left : left + pose.shape[1], :3] = snapped
        art[top:, left : left + pose.shape[1], 3] = pose[..., 3]
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
