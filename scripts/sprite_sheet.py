"""Shared helpers for cutting characters out of sprite sheets.

The sheets come out of an image model as poses on a flat magenta or green
ground, drawn bigger than they stand in the village and on a finer pixel
grid than the painting. Each pose is keyed off the ground, reduced to art
pixels of `block` sheet pixels each, and later scaled back up by the
painting's grid so it reads as part of the picture rather than a sticker
laid over it.
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


def cut(sheet: np.ndarray, box: tuple[int, int, int, int], block: int, ground=tight_ground) -> np.ndarray:
    """Key one pose off the magenta and reduce it to art pixels (RGBA)."""
    x, y, w, h = box
    crop = sheet[y - block : y + h + block, x - block : x + w + block].astype(int)
    r, g, b = crop[..., 0], crop[..., 1], crop[..., 2]
    solid = ~ground(r, g, b)

    rows = crop.shape[0] // block
    cols = crop.shape[1] // block
    out = np.zeros((rows, cols, 4), np.uint8)
    for j in range(rows):
        for i in range(cols):
            cell = (slice(j * block, (j + 1) * block), slice(i * block, (i + 1) * block))
            mask = solid[cell]
            # Half the block has to be figure for the art pixel to be figure.
            # The median of only those pixels keeps the outline dark instead
            # of averaging it into whatever it borders.
            if mask.mean() < 0.5:
                continue
            out[j, i, :3] = np.median(crop[cell][mask], axis=0)
            out[j, i, 3] = 255

    # Poses on a crowded sheet reach into each other's boxes - a raised sword
    # pokes up past the boots of the row above. Keep the pose itself (the
    # biggest piece) and any loose bit wholly inside the box, like a sparkle,
    # and drop pieces cut off by the box edge, which belong to a neighbour.
    pieces = sorted(_components(out[..., 3] > 0), key=len, reverse=True)
    for cells in pieces[1:]:
        ys, xs = zip(*cells)
        if min(ys) == 0 or min(xs) == 0 or max(ys) == rows - 1 or max(xs) == cols - 1:
            out[ys, xs] = 0

    ys, xs = np.nonzero(out[..., 3])
    return out[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]


def shared_palette(poses: dict[str, np.ndarray], colours: int) -> Image.Image:
    """One palette for every pose, so the same patch of cloth is the same
    colour in every frame. Without it a walking step can flicker between two
    shades. It spends its colours where the pixels are, so it suits a figure
    with no small details in a colour of their own; see `posterize`."""
    solid = np.concatenate([p[p[..., 3] > 0][:, :3] for p in poses.values()])
    strip = Image.fromarray(solid.reshape(1, -1, 3))
    return strip.quantize(colours, method=Image.Quantize.MEDIANCUT)


def snap(pose: np.ndarray, palette: Image.Image) -> np.ndarray:
    """The pose's colours moved onto the shared palette, alpha untouched.

    Each pixel takes the nearest palette colour. Pillow's own quantize with a
    fixed palette was tried first and sent the sword's grey steel to pink, so
    the matching is done here instead."""
    colours = np.array(palette.getpalette()[: len(palette.getcolors()) * 3]).reshape(-1, 3)
    rgb = pose[..., :3].reshape(-1, 1, 3).astype(int)
    nearest = ((rgb - colours[None]) ** 2).sum(2).argmin(1)
    out = pose.copy()
    out[..., :3] = colours[nearest].reshape(pose.shape[:2] + (3,))
    return out


def posterize(pose: np.ndarray, step: int) -> np.ndarray:
    """Every channel rounded to a multiple of `step`, alpha untouched.

    The other way to keep frames from flickering. A palette fitted to the
    pixels outvotes thin details - the hero's sword blade is a sliver of him,
    and its steel came out the cream of his trousers - while fixed steps
    treat every colour alike, and the same colour still always lands on the
    same step."""
    out = pose.copy()
    out[..., :3] = np.clip(np.round(pose[..., :3] / step) * step, 0, 255).astype(np.uint8)
    return out
