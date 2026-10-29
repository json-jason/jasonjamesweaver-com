#!/usr/bin/env python3
"""Cut Jason's hero out of his two sprite sheets for the village map.

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

from sprite_sheet import cape_safe_ground, cut, posterize

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
# the separate figures on it; the sheets do not change.
SHEETS = {
    "hero-sheet.webp": {
        "walk-0": (24, 16, 224, 304),
        "walk-1": (304, 16, 220, 304),
        "walk-2": (572, 16, 220, 304),
        "walk-3": (852, 16, 232, 304),
        "stand": (112, 336, 212, 316),
        "front": (444, 336, 232, 316),
        "look": (740, 336, 204, 320),
        "wave-0": (88, 672, 240, 304),
        "wave-1": (416, 672, 252, 304),
        "kneel": (748, 680, 332, 296),
        "idle-0": (284, 988, 236, 328),
        "idle-1": (568, 988, 256, 328),
    },
    "hero-sword-sheet.webp": {
        "draw-0": (88, 16, 232, 292),
        "draw-1": (396, 16, 252, 292),
        "draw-2": (700, 16, 380, 292),
        "point": (140, 320, 424, 296),
        "point-glint": (592, 320, 476, 296),
        "hold": (124, 660, 240, 308),
        "raise-0": (432, 568, 280, 400),
        "raise-1": (756, 520, 296, 448),
        "plant": (140, 980, 232, 308),
        "sheathe-0": (408, 984, 236, 304),
        "sheathe-1": (712, 984, 228, 308),
    },
}


def tunic_centre(pose: np.ndarray) -> int:
    """The column through the middle of his blue tunic."""
    return int(round(np.nonzero(is_tunic(pose))[1].mean()))


def is_tunic(pose: np.ndarray) -> np.ndarray:
    rgb = pose[..., :3].astype(int)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return (pose[..., 3] > 0) & (b > 140) & (b - r > 90) & (b - g > 40)


def neutral_outline(pose: np.ndarray) -> np.ndarray:
    """His outline without the purple tint.

    Where the black outline met the magenta ground the two blended, so the
    outline came out a very dark purple - too dark for the ground test to
    take, but enough to show as a purple rim against the grass. Any dark,
    purple-leaning pixel on his edge is turned to a plain dark of the same
    weight."""
    solid = pose[..., 3] > 0
    padded = np.pad(solid, 1)
    inner = padded[:-2, 1:-1] & padded[2:, 1:-1] & padded[1:-1, :-2] & padded[1:-1, 2:]
    rgb = pose[..., :3].astype(int)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    tinted = solid & ~inner & (np.maximum(r, b) <= 120) & (np.minimum(r, b) - g >= 16)
    out = pose.copy()
    dark = (np.minimum(r, b) // 2).astype(np.uint8)
    for channel in range(3):
        out[..., channel][tinted] = dark[tinted]
    return out


def passing(pose: np.ndarray) -> np.ndarray:
    """The moment in a step between two strides, made from a stride frame.

    His sheet's walk frames all have the same foot forward, so on their own
    they only shuffle. Below the hem of his tunic the stride is drawn in
    towards his feet - more the lower it goes, so the boots come together
    under him while the hips stay put - and the legs are one art pixel
    longer, which lifts him a little as a passing step does. Played between
    two strides it reads as legs swinging through."""
    hem = int(np.nonzero(is_tunic(pose).any(1))[0].max()) + 1
    legs = pose[hem:]
    rows = legs.shape[0]
    feet = np.nonzero(legs[-6:, :, 3].any(0))[0]
    centre = (feet.min() + feet.max()) / 2
    out_legs = np.zeros((rows + 1,) + legs.shape[1:], np.uint8)
    xs = np.arange(legs.shape[1])
    for k in range(rows + 1):
        source_row = min(rows - 1, k * rows // (rows + 1))
        squeeze = 1 - 0.45 * k / rows
        source_x = np.round(centre + (xs - centre) / squeeze).astype(int)
        inside = (source_x >= 0) & (source_x < legs.shape[1])
        out_legs[k, inside] = legs[source_row, source_x[inside]]
    return np.concatenate([pose[:hem], out_legs])


def main() -> None:
    poses = {}
    for sheet_name, boxes in SHEETS.items():
        sheet = np.asarray(Image.open(SOURCE / sheet_name).convert("RGB"))
        for name, box in boxes.items():
            poses[name] = neutral_outline(cut(sheet, box, BLOCK, cape_safe_ground))
    poses["pass-1"] = passing(poses["walk-1"])
    poses["pass-3"] = passing(poses["walk-3"])

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
