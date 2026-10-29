"""Shared helpers for cutting characters out of sprite sheets.

The sheets come out of an image model as poses on a flat magenta or green
ground, drawn bigger than they stand in the village and on a finer pixel
grid than the painting. Each pose is keyed off the ground and shrunk to
painting size.
"""

from __future__ import annotations

from collections import deque

import numpy as np
from PIL import Image

# What counts as the magenta ground. The sheets are lossy, so it is not one
# exact colour, and it bleeds a little into the outline it touches.
BACKGROUND_MIN_RED_BLUE = 215
BACKGROUND_MAX_GREEN = 30


def tight_ground(r: np.ndarray, g: np.ndarray, b: np.ndarray) -> np.ndarray:
    return (r > BACKGROUND_MIN_RED_BLUE) & (b > BACKGROUND_MIN_RED_BLUE) & (g < BACKGROUND_MAX_GREEN)


def loose_ground(r: np.ndarray, g: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Anything leaning well towards magenta. Safe for a figure with no purple
    in it, and it also drops the purple fringe where outline met ground."""
    return (np.minimum(r, b) - g) >= 60


def green_ground(r: np.ndarray, g: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Anything leaning well towards green, for sheets drawn on a green
    screen. The hero has no green on him - his gold is more red than green -
    so this takes the ground and the green fringe where it met his outline,
    and leaves his purple cape whole, which no magenta test could."""
    return (g - np.maximum(r, b)) >= 50


def _components(alpha: np.ndarray) -> list[list[tuple[int, int]]]:
    seen = np.zeros(alpha.shape, bool)
    found = []
    for y, x in zip(*np.nonzero(alpha)):
        if seen[y, x]:
            continue
        seen[y, x] = True
        queue, cells = deque([(y, x)]), []
        while queue:
            cy, cx = queue.popleft()
            cells.append((cy, cx))
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < alpha.shape[0] and 0 <= nx < alpha.shape[1] and alpha[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    queue.append((ny, nx))
        found.append(cells)
    return found


def cut(sheet: np.ndarray, box: tuple[int, int, int, int], scale: float, ground=tight_ground) -> np.ndarray:
    """Key one pose off the ground and shrink it by `scale` (RGBA).

    The sheets are not true pixel art: the image model draws fine detail at
    two or three sheet pixels, with no fixed grid to snap to. Squeezing a
    pose onto coarse blocks smeared his face, so it is shrunk smoothly
    instead and keeps the detail as drawn. Only figure pixels are averaged,
    so no ground colour bleeds into the edge, and a shrunk pixel is figure
    if at least half of what it covers was."""
    x, y, w, h = box
    pad = 8
    crop = sheet[y - pad : y + h + pad, x - pad : x + w + pad].astype(float)
    solid = (~ground(crop[..., 0], crop[..., 1], crop[..., 2])).astype(float)
    size = (round(crop.shape[1] * scale), round(crop.shape[0] * scale))

    def shrink(channel: np.ndarray) -> np.ndarray:
        image = Image.fromarray(channel.astype(np.float32), mode="F")
        return np.asarray(image.resize(size, Image.Resampling.BOX))

    cover = shrink(solid)
    out = np.zeros((size[1], size[0], 4), np.uint8)
    for channel in range(3):
        out[..., channel] = np.clip(shrink(crop[..., channel] * solid) / np.maximum(cover, 1e-3), 0, 255)
    out[..., 3] = (cover >= 0.5) * 255
    rows, cols = out.shape[:2]

    # Poses on a crowded sheet reach into each other's boxes - a raised sword
    # pokes up past the boots of the row above. Keep the pose itself (the
    # biggest piece) and any loose bit wholly inside the box, like a sparkle,
    # and drop pieces cut off by the box edge, which belong to a neighbour,
    # and single-pixel flecks of the ground's grain that came through the key.
    pieces = sorted(_components(out[..., 3] > 0), key=len, reverse=True)
    for cells in pieces[1:]:
        ys, xs = zip(*cells)
        if len(cells) < 3 or min(ys) == 0 or min(xs) == 0 or max(ys) == rows - 1 or max(xs) == cols - 1:
            out[ys, xs] = 0

    ys, xs = np.nonzero(out[..., 3])
    return out[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
