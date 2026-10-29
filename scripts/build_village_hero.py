#!/usr/bin/env python3
"""Cut Jason's hero out of his three sprite sheets for the village map.

The same hero as the title screen - blue tunic, purple cape, sword on the
hip - drawn in poses for walking, waving, kneeling to Zelda, and showing off
the sword. One sheet holds the everyday poses and the other the sword poses.

Placing the poses on a shared canvas is harder than for Zelda. A sword held
out to the side doubles his width, and a cape sweeps out behind, so centring
each pose's outline would make him lurch sideways whenever he draws. He is
lined up by his tunic instead: the blue of it is his body and nothing else
on him is that colour, so its middle is where he stands. The canvas is wide
enough for the furthest reach either side of that line, and the line is its
centre.

Outputs:
  public/images/nes/village-scene/hero-<pose>.webp
  app/data/village-hero.json  (the canvas size as a share of the painting)
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

from sprite_sheet import _components, cut, green_ground, posterize

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/images/nes/village-scene/source"
OUT = ROOT / "public/images/nes/village-scene"
MANIFEST = ROOT / "app/data/village-hero.json"

FIELD_W = 1448
FIELD_H = 1086

# Painting pixels per art pixel, the same as Zelda's, so the two read as one
# set. Five sheet pixels to an art pixel puts him a little under twice the
# height of the fence posts, with Zelda's back about level with his belt.
GRID = 3
BLOCK = 5
# Colours are rounded to this step so a frame never flickers between two
# near-identical shades of the same cloth.
COLOUR_STEP = 16

# The poses on each sheet as (x, y, width, height), measured once by finding
# the separate figures on it; the sheets do not change. All three are drawn
# on a green screen. The walk sheet was drawn on its own and bigger, so it is
# shrunk first by the share given with it, to make him the same height
# striding as standing.
WALK_SHEET_SCALE = 312 / 516
SHEETS = {
    "hero-walk-sheet.webp": (
        WALK_SHEET_SCALE,
        {
            "walk-0": (48, 76, 400, 512),
            "walk-1": (568, 72, 320, 516),
            "walk-2": (1020, 72, 404, 516),
            "walk-3": (1540, 72, 332, 516),
        },
    ),
    "hero-sheet.webp": (
        1,
        {
            "stand": (112, 336, 212, 316),
            "front": (444, 336, 232, 316),
            "look": (740, 336, 204, 320),
            "wave-0": (88, 672, 244, 304),
            "wave-1": (416, 672, 252, 304),
            "kneel": (748, 676, 328, 300),
            "idle-0": (284, 988, 236, 324),
            "idle-1": (568, 988, 256, 324),
        },
    ),
    "hero-sword-sheet.webp": (
        1,
        {
            "draw-0": (88, 16, 232, 292),
            "draw-1": (396, 16, 252, 292),
            "draw-2": (700, 16, 376, 292),
            "point": (140, 320, 444, 292),
            "point-glint": (592, 320, 460, 292),
            "hold": (120, 660, 252, 304),
            "raise-0": (432, 568, 280, 396),
            "raise-1": (756, 536, 296, 428),
            "plant": (140, 980, 232, 312),
            "sheathe-0": (416, 984, 232, 300),
            "sheathe-1": (716, 984, 224, 308),
        },
    ),
}


def tunic_centre(pose: np.ndarray) -> int:
    """The column through the middle of his blue tunic."""
    return int(round(np.nonzero(is_tunic(pose))[1].mean()))


def is_tunic(pose: np.ndarray) -> np.ndarray:
    rgb = pose[..., :3].astype(int)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return (pose[..., 3] > 0) & (b > 140) & (b - r > 90) & (b - g > 40)


def drop_specks(pose: np.ndarray) -> np.ndarray:
    """Without loose single art pixels - flecks of the screen's grain that
    came through the key. Bigger loose pieces, like a sword's sparkle, stay."""
    out = pose.copy()
    for cells in _components(pose[..., 3] > 0):
        if len(cells) < 3:
            ys, xs = zip(*cells)
            out[ys, xs] = 0
    return out


def neutral_outline(pose: np.ndarray) -> np.ndarray:
    """His outline without a green tint.

    Where the black outline met the green screen the two blended into a very
    dark green - too dark for the ground test to take, but enough to show as
    a rim against the painting. Any dark, green-leaning pixel on his edge is
    turned to a plain dark of the same weight."""
    solid = pose[..., 3] > 0
    padded = np.pad(solid, 1)
    inner = padded[:-2, 1:-1] & padded[2:, 1:-1] & padded[1:-1, :-2] & padded[1:-1, 2:]
    rgb = pose[..., :3].astype(int)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    tinted = solid & ~inner & (g <= 120) & (g - np.maximum(r, b) >= 16)
    out = pose.copy()
    dark = np.maximum(r, b).astype(np.uint8)
    for channel in range(3):
        out[..., channel][tinted] = dark[tinted]
    return out


def main() -> None:
    poses = {}
    for sheet_name, (scale, boxes) in SHEETS.items():
        image = Image.open(SOURCE / sheet_name).convert("RGB")
        if scale != 1:
            size = (round(image.width * scale), round(image.height * scale))
            image = image.resize(size, Image.Resampling.BOX)
        sheet = np.asarray(image)
        for name, box in boxes.items():
            scaled = tuple(round(v * scale) for v in box)
            poses[name] = drop_specks(neutral_outline(cut(sheet, scaled, BLOCK, green_ground)))

    centres = {name: tunic_centre(pose) for name, pose in poses.items()}
    reach = max(max(c, pose.shape[1] - c) for c, pose in zip(centres.values(), poses.values()))
    canvas_w = 2 * reach
    canvas_h = max(p.shape[0] for p in poses.values())

    for name, pose in poses.items():
        art = np.zeros((canvas_h, canvas_w, 4), np.uint8)
        top = canvas_h - pose.shape[0]
        left = reach - centres[name]
        art[top:, left : left + pose.shape[1]] = posterize(pose, COLOUR_STEP)
        image = Image.fromarray(art).resize((canvas_w * GRID, canvas_h * GRID), Image.NEAREST)
        image.save(OUT / f"hero-{name}.webp", lossless=True)

    manifest = {
        "poses": list(poses),
        "width": f"{canvas_w * GRID / FIELD_W * 100:.4f}%",
        "height": f"{canvas_h * GRID / FIELD_H * 100:.4f}%",
        "step": round(GRID / FIELD_W * 100, 4),
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"{len(poses)} poses, canvas {canvas_w * GRID}x{canvas_h * GRID} painting px")


if __name__ == "__main__":
    main()
